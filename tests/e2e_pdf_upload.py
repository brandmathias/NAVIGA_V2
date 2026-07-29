import argparse
import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


parser = argparse.ArgumentParser()
parser.add_argument("--base-url", default="http://127.0.0.1:3000")
args = parser.parse_args()
email = os.environ.get("NAVIGA_TEST_EMAIL", "upc.wanea@pegadaian.co.id")
password = os.environ.get("NAVIGA_TEST_PASSWORD", "UpcWanea*0")
fixture = Path(__file__).resolve().parents[1] / "tmp" / "fonnte-fixtures" / "fonnte-gadai-brando.pdf"

assert os.environ.get("FONNTE_ENABLED", "").strip().lower() != "true", "E2E fixture tidak boleh dijalankan saat Fonnte aktif"
assert fixture.is_file(), f"Fixture PDF aman belum dibuat: {fixture}"

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

    page.locator('input[type="file"]').set_input_files(fixture)
    rows = page.locator("tbody tr")
    expect(rows).to_have_count(1, timeout=60_000)

    sbg_values = [
        rows.nth(index).locator("td").nth(1).inner_text()
        for index in range(rows.count())
    ]
    assert sbg_values == ["117870009991"]
    expect(page.get_by_text("Brando Mathias Zusriadi", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Antrekan Terpilih (0)")).to_be_visible()
    assert page.get_by_text("Error Processing PDF").count() == 0
    assert page.get_by_text("Status Follow-up", exact=True).count() == 0

    print(json.dumps({
        "rows": len(sbg_values),
        "prefix": "11787",
        "customer": "Brando Mathias Zusriadi",
        "fonnte_enabled": False,
        "error_toast": False,
    }))
    browser.close()
