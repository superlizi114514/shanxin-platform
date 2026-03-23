import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 创建学校
  const school = await prisma.school.upsert({
    where: { code: 'sdxx' },
    update: {},
    create: {
      name: '山东信息职业技术学院',
      code: 'sdxx',
      address: '山东省潍坊市',
    },
  })

  console.log('✅ 学校创建成功:', school.name)

  // 创建管理员账号
  const hashedPassword = await bcrypt.hash('lzlz58205820', 12)

  const admin = await prisma.user.upsert({
    where: { email: '3471023785@qq.com' },
    update: { password: hashedPassword, role: 'admin' },
    create: {
      email: '3471023785@qq.com',
      name: '管理员',
      password: hashedPassword,
      role: 'admin',
      schoolId: school.id,
      emailVerified: new Date(),
    },
  })

  console.log('✅ 管理员账号创建成功:')
  console.log('   登录邮箱：3471023785@qq.com')
  console.log('   登录密码：lzlz58205820')

  console.log('\n🎉 数据库初始化完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
