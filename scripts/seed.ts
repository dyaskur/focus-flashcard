import 'dotenv/config';
import { db, sqlClient } from '../src/lib/server/db';
import { categories, questions as table } from '../src/lib/server/schema';
import { questions } from '../src/lib/content/questions';
try {
  await db.transaction(async (tx) => {
    for (const category of [
      { id: 'mendengar', name: 'Mendengar', color: 'blue' },
      { id: 'logika', name: 'Logika', color: 'orange' }
    ]) {
      await tx
        .insert(categories)
        .values(category)
        .onConflictDoUpdate({ target: categories.id, set: category });
    }
    for (const question of questions)
      await tx
        .insert(table)
        .values(question)
        .onConflictDoUpdate({ target: table.id, set: question });
  });
  console.log(`Seeded ${questions.length} questions (idempotent).`);
} finally {
  await sqlClient.end();
}
