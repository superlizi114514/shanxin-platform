import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建测试密码
  const hashedPassword = await bcrypt.hash('123456', 10)

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@shanxin.edu.cn' },
    update: {},
    create: {
      email: 'test@shanxin.edu.cn',
      name: '测试用户',
      password: hashedPassword,
      role: 'user',
      studentId: '2024001',
      school: '山东信息职业技术学院',
      major: '软件工程',
      class: '2024 级 1 班',
      phone: '13800138000',
      emailVerified: new Date(),
    },
  })

  // 创建管理员账号
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shanxin.edu.cn' },
    update: {},
    create: {
      email: 'admin@shanxin.edu.cn',
      name: '管理员',
      password: hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
    },
  })

  console.log('✅ 测试账号创建成功:')
  console.log('   用户账号:')
  console.log('     邮箱：test@shanxin.edu.cn')
  console.log('     密码：123456')
  console.log('   管理员账号:')
  console.log('     邮箱：admin@shanxin.edu.cn')
  console.log('     密码：123456')

  // ==================== 奎文校区数据 ====================
  console.log('\n开始 seeding 奎文校区建筑数据...')

  const kuwenBuildings = [
    {
      name: '1 号教学楼',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.712062283737986, lng: 119.15431329972904 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '教学楼',
      order: 1,
      icon: 'school',
    },
    {
      name: '2 号教学楼',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71157574922363, lng: 119.15543609179186 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '教学楼',
      order: 2,
      icon: 'school',
    },
    {
      name: '3 号教学楼',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71189518454379, lng: 119.15330979971895 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '教学楼',
      order: 3,
      icon: 'school',
    },
    {
      name: '4 号教学楼',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71224566585266, lng: 119.15340635924503 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '教学楼',
      order: 4,
      icon: 'school',
    },
    {
      name: '5 号教学楼',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71122909149866, lng: 119.15592162349446 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '教学楼',
      order: 5,
      icon: 'school',
    },
    {
      name: '办公楼',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71217175358596, lng: 119.15518573950773 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '办公楼',
      order: 6,
      icon: 'school',
    },
    {
      name: '图书馆',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71087026869744, lng: 119.1561416300472 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学校图书馆，藏书丰富',
      order: 7,
      icon: 'menu-book',
    },
    {
      name: '食堂',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71148556244866, lng: 119.15331816035336 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生食堂，提供各类餐饮',
      order: 8,
      icon: 'restaurant',
    },
    {
      name: '操场',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.70934719407642, lng: 119.1539122088026 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '标准田径场和篮球场',
      order: 9,
      icon: 'sports',
    },
    {
      name: '学生公寓 1',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.708065623468016, lng: 119.15434136225232 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 10,
      icon: 'home',
    },
    {
      name: '学生公寓 2',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.708074224684125, lng: 119.15361180138865 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 11,
      icon: 'home',
    },
    {
      name: '学生公寓 3',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.70849568309402, lng: 119.1545022947958 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 12,
      icon: 'home',
    },
    {
      name: '学生公寓 4',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.708753717714366, lng: 119.15513529613341 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 13,
      icon: 'home',
    },
    {
      name: '学生公寓 5',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.70918377348946, lng: 119.15509238078847 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 14,
      icon: 'home',
    },
    {
      name: '学生公寓 6',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71096417881799, lng: 119.15460958314615 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 15,
      icon: 'home',
    },
    {
      name: '学生公寓 7',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71098998149009, lng: 119.15403022598967 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 16,
      icon: 'home',
    },
    {
      name: '学生公寓 8',
      campus: 'kuwen',
      coordinates: JSON.stringify({ lat: 36.71100718326668, lng: 119.15321483443616 }),
      address: '山东省潍坊市奎文区鸢飞路 36 号',
      description: '学生公寓',
      order: 17,
      icon: 'home',
    },
  ]

  for (const building of kuwenBuildings) {
    await prisma.campusBuilding.upsert({
      where: { name: building.name },
      update: building,
      create: building,
    })
    console.log(`已添加/更新奎文校区建筑：${building.name}`)
  }

  // ==================== 滨海校区数据 ====================
  console.log('\n开始 seeding 滨海校区建筑数据...')

  const binhaiBuildings = [
    {
      name: '滨海教学楼',
      campus: 'binhai',
      coordinates: JSON.stringify({ lat: 36.7850, lng: 119.0650 }),
      address: '山东省潍坊市滨海区海河东路 8 号',
      description: '滨海校区主教学楼（坐标待更新）',
      order: 1,
      icon: 'school',
    },
  ]

  for (const building of binhaiBuildings) {
    await prisma.campusBuilding.upsert({
      where: { name: building.name },
      update: building,
      create: building,
    })
    console.log(`已添加/更新滨海校区建筑：${building.name}`)
  }

  console.log('\n校园建筑数据 seeding 完成!')

  // 教室位置数据 - 奎文校区
  console.log('\n开始 seeding 教室位置数据...')

  const kuwenClassrooms = [
    // 教学楼 A
    { buildingName: '教学楼 A', floor: 1, roomNumber: '101', roomName: '第一教室', capacity: 60, type: 'classroom' },
    { buildingName: '教学楼 A', floor: 1, roomNumber: '102', roomName: '第二教室', capacity: 60, type: 'classroom' },
    { buildingName: '教学楼 A', floor: 2, roomNumber: '201', roomName: '第三教室', capacity: 60, type: 'classroom' },
    { buildingName: '教学楼 A', floor: 2, roomNumber: '202', roomName: '第四教室', capacity: 60, type: 'classroom' },
    { buildingName: '教学楼 A', floor: 3, roomNumber: '301', roomName: '第五教室', capacity: 60, type: 'classroom' },

    // 教学楼 B
    { buildingName: '教学楼 B', floor: 1, roomNumber: '101', roomName: '计算机房 1', capacity: 40, type: 'lab' },
    { buildingName: '教学楼 B', floor: 1, roomNumber: '102', roomName: '计算机房 2', capacity: 40, type: 'lab' },
    { buildingName: '教学楼 B', floor: 2, roomNumber: '201', roomName: '实验室 1', capacity: 30, type: 'lab' },
    { buildingName: '教学楼 B', floor: 2, roomNumber: '202', roomName: '实验室 2', capacity: 30, type: 'lab' },
    { buildingName: '教学楼 B', floor: 3, roomNumber: '301', roomName: '报告厅', capacity: 100, type: 'lecture hall' },

    // 实训楼
    { buildingName: '实训楼', floor: 1, roomNumber: '101', roomName: '实训室 1', capacity: 30, type: 'lab' },
    { buildingName: '实训楼', floor: 2, roomNumber: '201', roomName: '实训室 2', capacity: 30, type: 'lab' },
    { buildingName: '实训楼', floor: 3, roomNumber: '301', roomName: '实训室 3', capacity: 30, type: 'lab' },
  ]

  for (const classroom of kuwenClassrooms) {
    const building = await prisma.campusBuilding.findUnique({
      where: { name: classroom.buildingName },
    })

    if (building) {
      await prisma.classroomLocation.upsert({
        where: {
          building_roomNumber: {
            building: classroom.buildingName,
            roomNumber: classroom.roomNumber,
          },
        },
        update: {
          buildingId: building.id,
          coordinates: building.coordinates,
        },
        create: {
          buildingId: building.id,
          building: classroom.buildingName,
          floor: classroom.floor,
          roomNumber: classroom.roomNumber,
          roomName: classroom.roomName,
          coordinates: building.coordinates,
          capacity: classroom.capacity,
          type: classroom.type,
        },
      })
      console.log(`已添加/更新教室：${classroom.buildingName} ${classroom.roomNumber}`)
    }
  }

  // 滨海校区教室
  const binhaiClassrooms = [
    { buildingName: '滨海教学楼', floor: 1, roomNumber: '101', roomName: '滨海第一教室', capacity: 50, type: 'classroom' },
    { buildingName: '滨海教学楼', floor: 1, roomNumber: '102', roomName: '滨海第二教室', capacity: 50, type: 'classroom' },
    { buildingName: '滨海教学楼', floor: 2, roomNumber: '201', roomName: '滨海第三教室', capacity: 50, type: 'classroom' },
    { buildingName: '滨海实训楼', floor: 1, roomNumber: '101', roomName: '滨海实训室 1', capacity: 30, type: 'lab' },
    { buildingName: '滨海实训楼', floor: 2, roomNumber: '201', roomName: '滨海实训室 2', capacity: 30, type: 'lab' },
  ]

  for (const classroom of binhaiClassrooms) {
    const building = await prisma.campusBuilding.findUnique({
      where: { name: classroom.buildingName },
    })

    if (building) {
      await prisma.classroomLocation.upsert({
        where: {
          building_roomNumber: {
            building: classroom.buildingName,
            roomNumber: classroom.roomNumber,
          },
        },
        update: {
          buildingId: building.id,
          coordinates: building.coordinates,
        },
        create: {
          buildingId: building.id,
          building: classroom.buildingName,
          floor: classroom.floor,
          roomNumber: classroom.roomNumber,
          roomName: classroom.roomName,
          coordinates: building.coordinates,
          capacity: classroom.capacity,
          type: classroom.type,
        },
      })
      console.log(`已添加/更新滨海教室：${classroom.buildingName} ${classroom.roomNumber}`)
    }
  }

  console.log('教室位置数据 seeding 完成!')

  // 信息大全分类数据
  console.log('\n开始 seeding 信息大全分类数据...')
  const guideCategories = [
    {
      name: '学习资源',
      icon: '📚',
      description: '课程资料、学习指南、考试资源',
      color: 'from-blue-500 to-blue-600',
      order: 1,
    },
    {
      name: '生活服务',
      icon: '🏠',
      description: '餐饮、购物、维修、便利信息',
      color: 'from-green-500 to-green-600',
      order: 2,
    },
    {
      name: '就业信息',
      icon: '💼',
      description: '实习机会、招聘信息、职业规划',
      color: 'from-orange-500 to-orange-600',
      order: 3,
    },
    {
      name: '社团组织',
      icon: '🎉',
      description: '社团活动、组织介绍、报名指南',
      color: 'from-purple-500 to-purple-600',
      order: 4,
    },
  ]

  for (const category of guideCategories) {
    await prisma.guideCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
    console.log(`已添加/更新分类：${category.name}`)
  }

  console.log('\n🎉 所有 seeding 数据完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
