import { PrismaClient } from '@prisma/client';

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('Vui lòng nhập username. Ví dụ: npm run make-admin admin');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { username: username.toLowerCase() },
      data: { role: 'ADMIN' },
    });
    console.log(`🎉 Đã nâng cấp tài khoản "${user.username}" thành ADMIN thành công!`);
  } catch (err) {
    console.error(`❌ Lỗi: Không tìm thấy người dùng có username "${username}"`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
