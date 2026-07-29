import argparse

from playwright.sync_api import sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument('pdf')
parser.add_argument('--base-url', default='http://127.0.0.1:3000')
args = parser.parse_args()

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f'{args.base_url}/pdf-broadcast')
    page.wait_for_url('**/login')
    page.get_by_label('Email').fill('upc.wanea@pegadaian.co.id')
    page.locator('input[type="password"]').fill('UpcWanea*0')
    page.get_by_role('button', name='Log in').click()
    page.wait_for_url('**/dashboard')
    page.goto(f'{args.base_url}/pdf-broadcast')
    page.locator('input[type="file"]').set_input_files(args.pdf)
    page.get_by_text('Error Processing PDF', exact=True).wait_for(timeout=60_000)
    page.get_by_text('Tidak ada data gadai untuk unit aktif pada PDF ini.', exact=True).wait_for()
    browser.close()
