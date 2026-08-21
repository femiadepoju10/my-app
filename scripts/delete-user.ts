import { db } from "../lib/db/index";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email address as an argument.");
    console.error("Usage: npx tsx scripts/delete-user.ts <email>");
    process.exit(1);
  }

  const user = await db.users.findFirst({
    where: { email },
    select: { id: true, name: true, email: true, role: true, deletedAt: true },
  });

  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  if (user.deletedAt) {
    console.log(`User "${user.name}" (${user.email}) is already removed.`);
    return;
  }

  await db.users.update({
    where: { id: user.id },
    data: { deletedAt: new Date() },
  });

  console.log(`Removed user "${user.name}" (${user.email}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
