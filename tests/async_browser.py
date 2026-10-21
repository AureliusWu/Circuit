"""Poll awaited browser values rather than treating a Promise as truthy."""
import time


def wait_async(page, expression, arg=None, timeout=30000, polling=100):
    deadline = time.monotonic() + timeout / 1000
    while True:
        # evaluate awaits a returned Promise and gives Python its actual value.
        result = page.evaluate(expression, arg)
        if result:
            return result
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError(f'Async browser condition stayed false for {timeout} ms: {expression}')
        page.wait_for_timeout(min(polling, remaining * 1000))
