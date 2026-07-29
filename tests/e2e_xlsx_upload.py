import argparse
import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:3000')
args = parser.parse_args()

email = os.environ.get('NAVIGA_TEST_EMAIL', 'upc.wanea@pegadaian.co.id')
password = os.environ.get('NAVIGA_TEST_PASSWORD', 'UpcWanea*0')
fixture = Path(__file__).resolve().parents[1] / 'tmp' / 'fonnte-fixtures' / 'fonnte-angsuran-brando.xlsx'

assert os.environ.get('FONNTE_ENABLED', '').strip().lower() != 'true', 'E2E fixture tidak boleh dijalankan saat Fonnte aktif'
assert fixture.is_file(), f'Fixture XLSX aman belum dibuat: {fixture}'

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f'{args.base_url}/xlsx-broadcast')
    page.wait_for_load_state('networkidle')
    if '/login' in page.url:
        page.get_by_label('Email').fill(email)
        page.locator('input[type="password"]').fill(password)
        page.get_by_role('button', name='Log in').click()
        page.wait_for_url('**/dashboard')
        page.goto(f'{args.base_url}/xlsx-broadcast')
        page.wait_for_load_state('networkidle')

    page.locator('input[type="file"]').set_input_files(fixture)
    expect(page.locator('tbody tr')).to_have_count(1, timeout=60_000)
    expect(page.get_by_text('Brando Mathias Zusriadi', exact=True)).to_be_visible()
    expect(page.get_by_role('button', name='Antrekan Terpilih (0)')).to_be_visible()
    assert page.get_by_text('Gagal Memproses File', exact=True).count() == 0
    assert page.get_by_text('Status Follow-up', exact=True).count() == 0
    page.get_by_role('checkbox', name='Pilih Brando Mathias Zusriadi').check()
    page.on('dialog', lambda dialog: dialog.accept())
    page.get_by_role('button', name='Antrekan Terpilih (1)').click()
    expect(page.get_by_text('Fonnte Belum Aktif', exact=True)).to_be_visible()
    expect(page.get_by_text('Fonnte belum dikonfigurasi di server. Tambahkan FONNTE_ENABLED=true dan FONNTE_TOKEN sebelum mengantrekan pesan.', exact=True)).to_be_visible()
    print(json.dumps({
        'rows': 1,
        'prefix': '11787',
        'customer': 'Brando Mathias Zusriadi',
        'fonnte_enabled': False,
        'unavailable_toast': True,
    }))
    browser.close()
