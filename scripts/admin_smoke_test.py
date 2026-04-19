from pathlib import Path
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8081/admin"
PASSWORD = "admin123"
CHROME_PATH = r"C:\Users\ajia\Downloads\playwright-chromium\chrome-win64\chrome.exe"
OUT = Path(r"d:/claude code project/start/my-app/scripts/admin_smoke_test_output.txt")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page()
    dialogs = []

    page.on('dialog', lambda dialog: (dialogs.append(f'{dialog.type}: {dialog.message}'), dialog.accept()))
    messages = []
    requests = []

    def on_request(request):
        if '/api/admin/' in request.url or 'supabase.co/rest/v1' in request.url:
            requests.append(f"REQ {request.method} {request.url}")

    def on_response(response):
        if '/api/admin/' in response.url or 'supabase.co/rest/v1' in response.url:
            requests.append(f"RES {response.status} {response.url}")

    page.on('request', on_request)
    page.on('response', on_response)
    page.goto(URL, wait_until='networkidle', timeout=120000)
    page.fill('input', PASSWORD)
    page.get_by_text('进入管理台').click()
    page.wait_for_timeout(3000)

    body_text = page.locator('body').inner_text()
    messages.append('页面文本前1000字:')
    messages.append(body_text[:1000])

    delete_post_buttons = page.get_by_text('删除帖子')
    messages.append(f'删除帖子按钮数量: {delete_post_buttons.count()}')
    if delete_post_buttons.count() > 0:
        post_box = delete_post_buttons.first.bounding_box()
        messages.append(f'删除帖子按钮坐标: {post_box}')
        delete_post_buttons.first.click(force=True)
        page.wait_for_timeout(1500)

        overlay_text = page.locator('body').inner_text()
        messages.append('点击删除后页面文本前1200字:')
        messages.append(overlay_text[:1200])

        dialogs.append('manual-confirm-triggered')
        page.evaluate("""
          () => {
            const target = Array.from(document.querySelectorAll('*')).find((node) => {
              return node.textContent?.includes('确定删除')
            })
            if (!target) {
              return false
            }

            const reactKey = Object.keys(target).find((key) => key.startsWith('__reactProps$'))
            const props = reactKey ? target[reactKey] : null
            const buttons = props?.children?.[2]
            const deleteButton = Array.isArray(buttons)
              ? buttons.find((item) => item?.text === '删除')
              : null

            if (deleteButton?.onPress) {
              deleteButton.onPress()
              return true
            }

            return false
          }
        """)
        page.wait_for_timeout(4000)

    body_text_after = page.locator('body').inner_text()
    messages.append('操作后页面文本前1000字:')
    messages.append(body_text_after[:1000])
    messages.append('捕获到的浏览器对话框:')
    messages.extend(dialogs)
    messages.append('捕获到的相关请求:')
    messages.extend(requests)

    OUT.write_text('\n'.join(messages), encoding='utf-8')
    browser.close()
