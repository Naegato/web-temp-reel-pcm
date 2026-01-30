const { PrismaClient } = require('./src/generated/prisma');

async function updateAdvisorRole() {
  const prisma = new PrismaClient();
  
  try {
    // Mettre à jour l'utilisateur advisor.test@example.com pour avoir le rôle ADVISOR
    const result = await prisma.user.update({
      where: {
        email: 'advisor.test@example.com'
      },
      data: {
        role: 'ADVISOR'
      }
    });
    
    console.log('✅ Advisor role updated:', result);
  } catch (error) {
    console.error('❌ Error updating role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdvisorRole();