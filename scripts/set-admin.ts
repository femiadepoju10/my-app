import { db } from "../lib/db/index";

async function main() {
  const email = process.argv[2] || "femiadepoju10@gmail.com";

  const user = await db.users.findFirst({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`User "${user.name}" (${user.email}) is already an admin.`);
    return;
  }

  await db.users.update({
    where: { id: user.id },
    data: { role: "admin" },
  });

  console.log(`Updated user "${user.name}" (${user.email}) to admin role.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
