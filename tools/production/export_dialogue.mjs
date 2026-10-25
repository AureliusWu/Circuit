import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const root=process.cwd(), project=path.basename(root), require=createRequire(import.meta.url);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const config=read('docs/production/full-media/cast.json');
const sources=[];
function source(file){const raw=fs.readFileSync(path.join(root,file));sources.push({path:file,sha256:hash(raw)});return JSON.parse(raw);}
function loadTypescript(file){
  const ts=require('typescript');
  require.extensions['.ts']=(module,filename)=>{
    const raw=fs.readFileSync(filename,'utf8');
    if(filename.startsWith(root+path.sep))sources.push({path:path.relative(root,filename).replaceAll(path.sep,'/'),sha256:hash(raw)});
    module._compile(ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
  };
  return require(path.join(root,file));
}
let scenes=[],rows=[],excluded=[];
const add=(sceneId,lineId,index,line,extra={})=>{
  const base={sceneId,lineId,lineIndex:index,speaker:line.speaker,text:line.text,...extra};
  if(['旁白','系统','n'].includes(line.speaker)){excluded.push({...base,reason:'narration_or_system'});return;}
  const actorId=config.aliases[line.speaker]??line.speaker,actor=config.actors[actorId];
  if(!actor)throw Error('Unmapped dialogue speaker: '+line.speaker);
  const id=(project+'-'+lineId).replaceAll('_','-').toLowerCase();
  rows.push({id,...base,actorId,voice:actor.voice,instruct:actor.instruct,
    seed:parseInt(hash(project+'\0'+lineId+'\0'+line.text).slice(0,8),16)%2000000000,
    textSha256:hash(line.text),medium:line.medium??extra.medium??'spoken'});
};
if(project==='NetLove'){
  const story=source('src/story/story.json');scenes=story.scenes;
  for(const scene of scenes)scene.lines.forEach((line,i)=>add(scene.id,line.id,i,line));
}else if(project==='Healing'){
  scenes=loadTypescript('src/story/index.ts').scenes;
  for(const scene of scenes)scene.lines.forEach((line,i)=>add(scene.id,`${scene.id}--${String(i+1).padStart(3,'0')}`,i,line));
}else if(project==='Rain'){
  const story=source('game/data/story.json');scenes=story.nodes;
  for(const scene of scenes){
    (scene.lines??[]).forEach((line,i)=>add(scene.id,line.id,i,line));
    for(const choice of scene.choices??[])(choice.response??[]).forEach((line,i)=>add(scene.id,line.id,i,line,{choiceId:choice.id}));
  }
}else if(project==='Circuit'){
  const chapters=Object.values(loadTypescript('src/story/engine.ts').CHAPTERS);
  scenes=chapters;
  const review=source('docs/production/full-media/dialogue-segments.json');
  const extras=source('docs/production/full-media/dialogue-extra.json');
  const legacyPlan=source('docs/audio/voice-plan.json');
  const legacyRecords=source('docs/audio/voice-manifest.json').clips;
  const legacyAsr=source('docs/audio/voice-asr.json');
  const approved=legacyRecords.filter(record=>legacyAsr.clips.some(result=>result.id===record.id
    &&result.status==='passed'&&result.expected===record.text
    &&record.files.some(file=>file.path.endsWith('.mp3')&&file.sha256===result.mp3Sha256)));
  const recordingRoots=new Map();
  const splitSpeech=(text,actorId)=>{
    const candidates=approved.filter(record=>record.character===actorId&&text.includes(record.text))
      .sort((a,b)=>b.text.length-a.text.length);
    const ranges=[];
    for(const record of candidates){
      let start=text.indexOf(record.text);
      while(start>=0){const end=start+record.text.length;
        if(!ranges.some(range=>start<range.end&&end>range.start))ranges.push({start,end,record});
        start=text.indexOf(record.text,start+record.text.length);
      }
    }
    ranges.sort((a,b)=>a.start-b.start);
    const pieces=[];let cursor=0;
    for(const range of ranges){if(range.start>cursor)pieces.push({text:text.slice(cursor,range.start),start:cursor});
      const proof=legacyAsr.clips.find(result=>result.id===range.record.id);
      pieces.push({text:text.slice(range.start,range.end),start:range.start,legacy:{...range.record,asr:proof,asrModel:legacyAsr.model,
        evidencePath:'docs/audio/voice-asr.json',evidenceSha256:sources.find(row=>row.path==='docs/audio/voice-asr.json').sha256}});cursor=range.end;}
    if(cursor<text.length)pieces.push({text:text.slice(cursor),start:cursor});
    return pieces;
  };
  const appendSpeech=(chapterId,nodeId,text,actorId,start,identity,extra={})=>{
    for(const[partIndex,part]of splitSpeech(text,actorId).entries()){
      if(!/[\p{L}\p{N}]/u.test(part.text)){excluded.push({sceneId:chapterId,nodeId,text:part.text,reason:'punctuation_only'});continue;}
      const lineId=`${chapterId}--${nodeId}--${identity}--${String(partIndex+1).padStart(2,'0')}`;
      const group=part.legacy?'legacy:'+part.legacy.id:extra.recordingKey;
      add(chapterId,lineId,partIndex,{speaker:actorId,text:part.text},{nodeId,start:start+part.start,end:start+part.start+part.text.length,
        ...extra,...(part.legacy?{legacy:part.legacy}:{}),...(group&&recordingRoots.has(group)?{replayOf:recordingRoots.get(group)}:{})});
      if(group&&!recordingRoots.has(group))recordingRoots.set(group,rows.at(-1).id);
    }
  };
  for(const chapter of chapters)for(const[nodeId,node]of Object.entries(chapter.nodes)){
    const identity=chapter.id+'/'+nodeId,quotes=[...node.text.matchAll(/“([^”]+)”/g)];
    const decisions=review[identity]??[];
    if(decisions.length!==quotes.length)throw Error('Unreviewed quoted span: '+identity);
    quotes.forEach((match,i)=>{
      const decision=decisions[i];
      if(decision==='citation'){excluded.push({sceneId:chapter.id,nodeId,quoteIndex:i,text:match[1],reason:'quoted_label_or_document'});return;}
      if(!config.actors[decision])throw Error('Unresolved quoted speaker: '+identity+'/'+i);
      appendSpeech(chapter.id,nodeId,match[1],decision,match.index+1,`q${String(i+1).padStart(2,'0')}`,{quoteIndex:i});
    });
    for(const[index,extra]of(extras[identity]??[]).entries()){
      const start=node.text.indexOf(extra.anchor??extra.text)+(extra.anchorOffset??0);
      if(start<0||node.text.slice(start,start+extra.text.length)!==extra.text)throw Error('Unbound unquoted speech: '+identity);
      if(quotes.some(match=>start>=match.index&&start<match.index+match[0].length))throw Error('Unquoted speech duplicates a quoted cue');
      appendSpeech(chapter.id,nodeId,extra.text,extra.actorId,start,`extra${index+1}`,{medium:'recorded',recordingKey:extra.recordingKey});
    }
  }
}else throw Error('Unsupported project '+project);
// Keep author-reviewed number pronunciation reproducible in future exports.
// The visible text and recording identity remain unchanged.
if(project==='Circuit'){
  const overrides=source('docs/production/full-media/pronunciation-overrides.json');
  for(const [id,override] of Object.entries(overrides)){
    const row=rows.find(candidate=>candidate.id===id);
    if(!row||row.text!==override.text||!override.spokenText)throw Error('Stale pronunciation override: '+id);
    row.spokenText=override.spokenText;
  }
}
const ids=rows.map(row=>row.id);
if(new Set(ids).size!==ids.length)throw Error('Duplicate dialogue recording identity');
const semantic=rows.map(({id,sceneId,lineId,lineIndex,speaker,text,medium,nodeId,quoteIndex,choiceId})=>({id,sceneId,lineId,lineIndex,speaker,text,medium,...(nodeId?{nodeId,quoteIndex}:{}),...(choiceId?{choiceId}:{})}));
const output={schema:1,project,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  sourceFiles:[...new Map(sources.map(s=>[s.path,s])).values()],semanticSha256:hash(JSON.stringify(semantic)),
  scope:{allBranches:true,writtenDialogue:true,narration:false,excludedCount:excluded.length},
  sceneCount:scenes.length,model:config.model,actors:config.actors,lines:rows,excluded};
const target=process.argv[2]??'docs/production/full-media/dialogue-plan.json';
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({project,lines:rows.length,scenes:scenes.length,semanticSha256:output.semanticSha256,target}));
