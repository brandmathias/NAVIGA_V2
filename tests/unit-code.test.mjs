import assert from 'node:assert/strict';
import test from 'node:test';
import { formatUnitCode } from '../src/lib/unit-code.js';
import gadaiParser from '../src/lib/gadai-ocr-parser.js';
import installmentImporter from '../src/lib/installment-import.js';

test('formats a display code without changing the five-digit extraction prefix', () => {
  assert.equal(formatUnitCode('Manado', '11787'), 'CP-MND-11787');
  assert.equal(formatUnitCode('Manado', '1178'), '');
});

test('uses the provincial capital initials when a domicile province is selected', () => {
  assert.equal(formatUnitCode('Bali', '11787'), 'CP-DPS-11787');
  assert.equal(formatUnitCode('DKI Jakarta', '11787'), 'CP-JKT-11787');
});

test('gadai and angsuran filters accept only the raw five-digit prefix, never its display code', () => {
  const displayCode = formatUnitCode('Manado', '11787');
  const gadaiCustomers = [{ sbg_number: '1178725010004741' }];
  const installmentCustomers = [{ account_number: '117870000001' }];

  assert.equal(gadaiParser.filterGadaiCustomersByPrefix(gadaiCustomers, '11787').length, 1);
  assert.equal(installmentImporter.filterInstallmentCustomersByPrefix(installmentCustomers, '11787').length, 1);
  assert.equal(gadaiParser.filterGadaiCustomersByPrefix(gadaiCustomers, displayCode).length, 0);
  assert.equal(installmentImporter.filterInstallmentCustomersByPrefix(installmentCustomers, displayCode).length, 0);
});
