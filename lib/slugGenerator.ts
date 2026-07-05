import { prisma } from "./dbHelper";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-")         // spaces → dash
    .replace(/-+/g, "-");         // remove duplicate dashes
}

export async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let count =1;

    while (true) {
        const existing  = await prisma.business.findUnique({
            where: {slug}
        })
        if (!existing) break;
        slug =  `${baseSlug}-${count}`;;
        count++;
    }
    return slug;
}