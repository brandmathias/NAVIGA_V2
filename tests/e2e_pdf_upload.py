import argparse
import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument("pdf")
parser.add_argument("expected_rows", type=int)
parser.add_argument("expected_prefix")
parser.add_argument("--base-url", default="http://127.0.0.1:3000")
parser.add_argument("--superadmin", action="store_true")
args = parser.parse_args()
email = os.environ.get("NAVIGA_TEST_EMAIL", "upc.wanea@pegadaian.co.id")
password = os.environ.get("NAVIGA_TEST_PASSWORD", "UpcWanea*0")

if args.superadmin:
    local_env = Path('.env.local').read_text(encoding='utf-8').splitlines()
    values = dict(line.split('=', 1) for line in local_env if '=' in line)
    email = values['NAVIGA_SUPERADMIN_EMAIL']
    password = values['NAVIGA_SUPERADMIN_PASSWORD']

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"{args.base_url}/pdf-broadcast")
    page.wait_for_load_state("networkidle")

    if "/login" in page.url:
        page.get_by_label("Email").fill(email)
        page.locator('input[type="password"]').fill(password)
        page.get_by_role("button", name="Log in").click()
        page.wait_for_url("**/dashboard")
        page.goto(f"{args.base_url}/pdf-broadcast")
        page.wait_for_load_state("networkidle")

    page.locator('input[type="file"]').set_input_files(args.pdf)
    rows = page.locator("tbody tr")
    expect(rows).to_have_count(args.expected_rows, timeout=60_000)

    sbg_values = rows.locator("td:nth-child(2)").all_inner_texts()
    assert all(value.strip().startswith(args.expected_prefix) for value in sbg_values)
    assert page.get_by_text("Error Processing PDF").count() == 0
    assert page.get_by_text("Status Follow-up", exact=True).count() == 0

    print(json.dumps({
        "rows": len(sbg_values),
        "prefix": args.expected_prefix,
        "error_toast": False,
    }))
    browser.close()
