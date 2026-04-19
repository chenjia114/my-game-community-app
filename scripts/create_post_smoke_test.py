from pathlib import Path
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8081/create"
CHROME_PATH = r"C:\Users\ajia\Downloads\playwright-chromium\chrome-win64\chrome.exe"
OUT = Path(r"d:/claude code project/start/my-app/scripts/create_post_smoke_test_output.txt")
TINY_PNG_DATA_URL = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0w0AAAAASUVORK5CYII="
)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page()
    logs = []

    def on_request(request):
        if (
            '/api/post-image' in request.url
            or '/api/posts' in request.url
            or 'storage/v1/object/post-images' in request.url
            or '/rest/v1/posts' in request.url
        ):
            logs.append(f"REQ {request.method} {request.url}")
            try:
                payload = request.post_data
                if payload:
                    logs.append(f"REQ_BODY {payload[:500]}")
            except Exception as error:
                logs.append(f"REQ_BODY_ERROR {error}")

    def on_response(response):
        if (
            '/api/post-image' in response.url
            or '/api/posts' in response.url
            or 'storage/v1/object/post-images' in response.url
            or '/rest/v1/posts' in response.url
        ):
            logs.append(f"RES {response.status} {response.url}")
            try:
                body = response.text()
                if body:
                    logs.append(f"RES_BODY {body[:1000]}")
            except Exception as error:
                logs.append(f"RES_BODY_ERROR {error}")

    page.on('request', on_request)
    page.on('response', on_response)
    page.on('console', lambda msg: logs.append(f'CONSOLE {msg.type} {msg.text}'))
    page.on('dialog', lambda dialog: (logs.append(f'DIALOG {dialog.type} {dialog.message}'), dialog.dismiss()))
    page.goto(URL, wait_until='networkidle', timeout=120000)

    page.fill('input[placeholder="输入帖子标题"]', '自测发帖标题')
    textareas = page.locator('textarea')
    if textareas.count() > 0:
        textareas.first.fill('自测发帖内容')
    else:
        page.locator('input[placeholder="输入帖子内容（可选）"]').fill('自测发帖内容')

    page.evaluate(
        """
        ({ previewUrl }) => {
          window.__createDebugSetSelectedImage?.(previewUrl, previewUrl)
        }
        """,
        {"previewUrl": TINY_PNG_DATA_URL},
    )
    page.wait_for_timeout(1000)
    logs.append(f'调试注入可用: {page.evaluate("Boolean(window.__createDebugSetSelectedImage)")}')
    logs.append(f'调试提交可用: {page.evaluate("Boolean(window.__createDebugSubmit)")}')

    submit_button = page.locator('[data-testid="create-submit-button"]').first
    logs.append(f'发布按钮文本: {submit_button.inner_text()}')
    logs.append(f'发布按钮可见: {submit_button.is_visible()}')
    page.evaluate("window.__createDebugSubmit?.()")
    page.wait_for_timeout(12000)
    logs.append(f'调试状态: {page.evaluate("JSON.stringify((window).__createDebugState || null)")}')

    body_text = page.locator('body').inner_text()
    logs.append('页面文本前1200字:')
    logs.append(body_text[:1200])
    OUT.write_text('\n'.join(logs), encoding='utf-8')
    browser.close()
