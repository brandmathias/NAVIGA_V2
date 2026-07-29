import os

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get('NAVIGA_TEST_BASE_URL', 'http://127.0.0.1:3000')
EMAIL = os.environ.get('NAVIGA_TEST_EMAIL', 'upc.wanea@pegadaian.co.id')
PASSWORD = os.environ.get('NAVIGA_TEST_PASSWORD', 'UpcWanea*0')

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto(f'{BASE_URL}/dashboard')
    page.wait_for_load_state('networkidle')
    page.wait_for_url('**/login')

    page.get_by_label('Email').fill(EMAIL)
    page.locator('input[type="password"]').fill(PASSWORD)
    page.get_by_role('button', name='Log in').click()
    page.wait_for_url('**/dashboard')
    page.get_by_text('Profil UPC Wanea').wait_for()
    assert page.get_by_text('Manajemen Unit').count() == 0

    for path, heading in [
        ('/tasks', 'Lacak Tugas & Alur Kerja'),
        ('/pdf-broadcast', 'Gadaian Broadcast'),
        ('/xlsx-broadcast', 'Angsuran Broadcast'),
        ('/history', 'Riwayat Aktivitas Broadcast'),
        ('/profile', 'Detail akun sesi lokal Anda'),
    ]:
        page.goto(f'{BASE_URL}{path}')
        page.wait_for_load_state('networkidle')
        page.get_by_text(heading, exact=True).wait_for()

    browser.close()
