#!/usr/bin/env python3
"""Compatibility entry point for the complete v1.0 browser regression."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('release-browser.py')), run_name='__main__')
