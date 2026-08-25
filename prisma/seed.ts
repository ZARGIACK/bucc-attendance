import { PrismaClient } from "@prisma/client";
import path from "path";
import { readFile } from "fs/promises";

const prisma = new PrismaClient();

function parseCsv(contents: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < contents.length; i++) {
    const char = contents[i];
    if (char === '"') {
      if (quoted && contents[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && contents[i + 1] === "\n") i++;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  const [headers, ...records] = rows;
  if (!headers) return [];
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), record[index] ?? ""])),
  );
}

async function main() {
  const filePath = path.join(process.cwd(), "All_Department_Members_Spring26 - All_Members.csv");
  // Headers are: 'Student Id', 'Name', 'Department', 'Designation', 'Phone Number', 'G-Suite'
  const rows = parseCsv(await readFile(filePath, "utf8"));

  console.log(`Found ${rows.length} rows in the Excel file. Seeding CentralMember...`);

  let count = 0;
  for (const row of rows) {
    const email = row["G-Suite"]?.toString().trim().toLowerCase();
    const studentId = row["Student Id"]?.toString().trim();
    const name = row["Name"]?.toString().trim();
    const department = row["Department"]?.toString().trim();
    const designation = row["Designation"]?.toString().trim();

    if (!email || !studentId || !name) {
      continue;
    }

    try {
      await prisma.centralMember.upsert({
        where: { studentId },
        update: {
          email,
          name,
          department: department || "Unknown",
          designation: designation || "Executive",
          isActive: true,
        },
        create: {
          email,
          name,
          studentId,
          department: department || "Unknown",
          designation: designation || "Executive",
          isActive: true,
        },
      });
      count++;
    } catch (error: any) {
      console.warn(`[WARNING] Skipping duplicate/conflict for Student ID ${studentId}, Email ${email}`);
    }
  }

  console.log(`Successfully seeded ${count} executives/members into CentralMember table.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
