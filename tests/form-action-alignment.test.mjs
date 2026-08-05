import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('unit-management forms keep cancel on the left and save on the right', async () => {
  const [unitCreate, unitManagement, globals, profileStyles] = await Promise.all([
    readFile('src/app/(main)/unit-management/new/unit-create-client.tsx', 'utf8'),
    readFile('src/app/(main)/unit-management/unit-management-client.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
    readFile('src/app/(main)/profile/profile.module.css', 'utf8'),
  ]);

  const unitFooters = [...unitCreate.matchAll(/<footer className="unit-reference-footer">([\s\S]*?)<\/footer>/g)]
    .map((match) => match[1]);

  assert.equal(unitFooters.length, 2, 'unit create and admin-only forms should both expose an action footer');
  for (const footer of unitFooters) {
    assert.ok(
      footer.indexOf('unit-reference-cancel') < footer.indexOf('unit-reference-save'),
      'cancel must precede save in the action footer DOM order',
    );
  }

  assert.match(globals, /\.unit-reference-footer \{[^}]*justify-content: space-between;/s);
  assert.match(globals, /\.unit-admin-actions \{[^}]*justify-content: space-between;/s);
  assert.match(globals, /\.unit-admin-actions \{ flex-direction: column; \}/);

  const adminActions = unitManagement.match(/<div className="unit-admin-actions">([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.ok(
    adminActions.indexOf('unit-admin-cancel') < adminActions.indexOf('unit-admin-submit'),
    'admin dialog cancel must precede save in the action row DOM order',
  );

  const dialogActions = profileStyles.match(/\.dialogActions \{([^}]*)\}/s)?.[1] ?? '';
  assert.match(dialogActions, /justify-content: space-between;/);
});
