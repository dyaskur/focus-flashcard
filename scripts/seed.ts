import 'dotenv/config';
import { db, sqlClient } from '../src/lib/server/db';
import { categories, questions as table, pilotCards as pilotTable } from '../src/lib/server/schema';
import { questions } from '../src/lib/content/questions';
import { pilotCards } from '../src/lib/pilot/cards';
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
    for (const card of pilotCards)
      await tx
        .insert(pilotTable)
        .values({ id: card.id, content: card })
        .onConflictDoUpdate({ target: pilotTable.id, set: { content: card } });
  });
  console.log(
    `Seeded ${questions.length} legacy questions and ${pilotCards.length} bilingual pilot cards (idempotent).`
  );
} finally {
  await sqlClient.end();
}
