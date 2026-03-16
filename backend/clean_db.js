const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFlagEmoji = (countryCode) => {
  if (!countryCode) return '';
  return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

async function clean() {
  console.log('🗑️ Deleting Israel room...');
  await prisma.room.deleteMany({
    where: { country_code: 'IL', type: 'global' }
  });

  console.log('🏳️ Adding flags to all global rooms...');
  const globalRooms = await prisma.room.findMany({ where: { type: 'global' } });
  
  for (const room of globalRooms) {
    const flag = getFlagEmoji(room.country_code);
    // Remove "Global Chat" and globe, replace with flag
    // The previous names might be like "Afghanistan 🌍" or "Afghanistan 🌍 Global Chat"
    // We want: "🇦🇫 Afghanistan"
    const baseName = room.name.replace('🌍', '').replace('Global Chat', '').trim();
    const newName = `${flag} ${baseName}`;
    
    if (newName !== room.name) {
      await prisma.room.update({
        where: { id: room.id },
        data: { name: newName }
      });
    }
  }
  console.log('✅ DB cleaned and flags added.');
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
