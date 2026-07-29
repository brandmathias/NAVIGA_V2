import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get('NAVIGA_TEST_BASE_URL', 'http://127.0.0.1:3000')
SCREENSHOT_PATH = os.environ.get('NAVIGA_SCREENSHOT_PATH')


def read_local_env(name: str) -> str:
    for line in Path('.env.local').read_text(encoding='utf-8').splitlines():
        if line.startswith(f'{name}='):
            return line.split('=', 1)[1]
    raise RuntimeError(f'{name} tidak ditemukan di .env.local')


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    for width in (320, 375, 414, 768, 1440):
        page = browser.new_page(viewport={'width': width, 'height': 900})
        page.goto(f'{BASE_URL}/unit-management')
        page.wait_for_url('**/login')
        page.get_by_label('Email').fill(read_local_env('NAVIGA_SUPERADMIN_EMAIL'))
        page.locator('input[type="password"]').fill(read_local_env('NAVIGA_SUPERADMIN_PASSWORD'))
        page.get_by_role('button', name='Log in').click()
        page.wait_for_url('**/dashboard')
        page.goto(f'{BASE_URL}/unit-management')
        page.get_by_role('heading', name='Manajemen Unit').wait_for()
        expect(page.get_by_role('cell', name='Pegadaian Wanea').first).to_be_visible()
        expect(page.get_by_role('cell', name='Pegadaian Ranotana').first).to_be_visible()
        if SCREENSHOT_PATH and width == 1440:
            Path(SCREENSHOT_PATH).parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=SCREENSHOT_PATH, full_page=True)
        page.get_by_role('button', name='Tambah unit').click()
        page.wait_for_url('**/unit-management/new')
        expect(page.get_by_role('heading', name='Tambah Unit')).to_be_visible()
        expect(page.get_by_text('Kode tampilan unit')).to_be_visible()
        page.goto(f'{BASE_URL}/unit-management')
        page.get_by_role('button', name='Tambahkan akun').click()
        page.wait_for_url('**/unit-management/new?mode=admin')
        expect(page.get_by_label('Unit terkait')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        page.close()

    browser.close()
