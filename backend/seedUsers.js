const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const departments = {
  ENVIRONMENT: '692fe87076a789c3f5a4c8fb',
  STORES: '692fe87076a789c3f5a4c8fc',
  LOGISTICS: '692fe87076a789c3f5a4c8fd',
  WELLNESS_AND_PERSONAL_GROWTH: '692fe87076a789c3f5a4c8fe',
  PUBLIC_RELATIONS: '692fe87076a789c3f5a4c8ff',
  WELFARE: '692fe87076a789c3f5a4c900',
};

const defaultLeave = {
  annual: { total: 28, taken: 0, remaining: 28, pending: 0 },
  maternity: { total: 90, taken: 0, remaining: 90, pending: 0 },
  paternity: { total: 14, taken: 0, remaining: 14, pending: 0 },
  sick: { total: 30, taken: 0, remaining: 30, pending: 0 },
  compassionate: { total: 7, taken: 0, remaining: 7, pending: 0 },
  study: { total: 30, taken: 0, remaining: 30, pending: 0 },
};

const usersData = [
  { employeeId: '20230000000', firstName: 'Makongeni', lastName: 'Admin', email: 'admin@makongeni.com', password: 'admin16494344', role: 'admin', department: departments.ENVIRONMENT, position: 'Environment officer' },
  { employeeId: '20230236536', firstName: 'Boscoh', lastName: 'Otieno', email: 'boscobrilli8@gmail.com', password: '0715640443', role: 'supervisor', department: departments.ENVIRONMENT, position: 'Environment officer' },
  { employeeId: '20230218350', firstName: 'Felix', lastName: 'Peter', email: 'felix123@gmail.com', password: '0703468256', role: 'clerk', department: departments.ENVIRONMENT, position: 'clerk' },
  { employeeId: '20230255849', firstName: 'Agnes', lastName: 'Waruguru', email: 'waruguruagnes74@gmail.com', password: '0719276260', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230257744', firstName: 'Annastacia', lastName: 'Ndila', email: 'anamutisya531@gmail.com', password: '0745481298', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240136364', firstName: 'Anne', lastName: 'Muthoni', email: 'annemso2024@gmail.com', password: '0714928904', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230217045', firstName: 'Benson', lastName: 'Mutinda', email: 'bensonmutuku330@gmail.com', password: '0795050204', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230262799', firstName: 'Bernard', lastName: 'Otash', email: 'benardoumaotash@gmail.com', password: '0717765982', role: 'staff', department: departments.WELLNESS_AND_PERSONAL_GROWTH, position: 'Spiritual leader' },
  { employeeId: '20230218635', firstName: 'Brian', lastName: 'Kipkosgei', email: 'briankipkosgei664@gmail.com', password: '0707227529', role: 'staff', department: departments.WELFARE, position: 'Treasurer' },
  { employeeId: '20230229856', firstName: 'Chebet', lastName: 'Cheres', email: 'chebet123@gmail.com', password: '0726984103', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230268892', firstName: 'Cornelius', lastName: 'Kipkemei', email: 'corneliuskipkemei364@gmail.com', password: '0110554524', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240119817', firstName: 'Elizabeth', lastName: 'Ashley', email: 'dorothyashley32@gmail.com', password: '0728263587', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230257184', firstName: 'Elizabeth', lastName: 'Mwelu', email: 'elizabethmwelu48@gmail.com', password: '0113065005', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240132946', firstName: 'Ephantus', lastName: 'Kiongo', email: 'ephantusm414@gmail.com', password: '0720968757', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230256227', firstName: 'Eugene', lastName: 'Charles', email: 'eugene123@gmail.com', password: '0705271048', role: 'staff', department: departments.LOGISTICS, position: 'logistics officer' },
  { employeeId: '20230216031', firstName: 'Frida', lastName: 'Atieno', email: 'ochiengfrida38@gmail.com', password: '0746536843', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240125745', firstName: 'Galgalo', lastName: 'Godana', email: 'godanagalgalo825@gmail.com', password: '0745690482', role: 'staff', department: departments.WELFARE, position: 'chairman' },
  { employeeId: '20230237029', firstName: 'George', lastName: 'Odhiambo', email: 'priestlygeorgekhallid@gmail.com', password: '0792569226', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230216578', firstName: 'Grace', lastName: 'Wangari', email: 'wangariwa4@gmail.com', password: '0714325903', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230239136', firstName: 'Halima', lastName: 'Warema', email: 'halimawarema@gmail.com', password: '0720629718', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230217540', firstName: 'Immaculate', lastName: 'Momanyi', email: 'immaqulatemomanyi@gmail.com', password: '0716299633', role: 'staff', department: departments.PUBLIC_RELATIONS, position: 'deputy spokesperson' },
  { employeeId: '20240121741', firstName: 'John', lastName: 'Chege', email: 'gajohni1986@gmail.com', password: '0702232397', role: 'staff', department: departments.WELLNESS_AND_PERSONAL_GROWTH, position: 'Ass. Guidance & counselling' },
  { employeeId: '20240133146', firstName: 'Judith', lastName: 'Wanjugu', email: 'judythwanjugu@gmail.com', password: '0796773374', role: 'staff', department: departments.WELFARE, position: 'secretary' },
  { employeeId: '20240137912', firstName: 'Kevin', lastName: 'Kimai', email: 'kevkimai8@gmail.com', password: '0724608515', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230219429', firstName: 'Kyalo', lastName: 'Mulei', email: 'kyalomulei3@gmail.com', password: '0713059520', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240122242', firstName: 'Lazarus', lastName: 'Omondi', email: 'lazarusomondi82@gmail.com', password: '0745543664', role: 'staff', department: departments.STORES, position: 'Stores officer' },
  { employeeId: '20230256073', firstName: 'Lilian', lastName: 'Kawira', email: 'kawiralilian72@gmail.com', password: '0729558364', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240137988', firstName: 'Lucy', lastName: 'Awuor', email: 'lucy123@gmail.com', password: '0711600598', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240193049', firstName: 'Lydiah', lastName: 'Akinyi', email: 'lydiaakinyi633@gmail.com', password: '0702889168', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230244270', firstName: 'Margaret', lastName: 'Mugure', email: 'margaretnyoike25@gmail.com', password: '0711793382', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240194249', firstName: 'Margret', lastName: 'Mukuhi', email: 'margaretmukuhi80@gmail.com', password: '0723791469', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240125208', firstName: 'Meresa', lastName: 'Akoth', email: 'meresaakoth00@gmail.com', password: '0721610935', role: 'staff', department: departments.WELLNESS_AND_PERSONAL_GROWTH, position: 'Guidance & counselling' },
  { employeeId: '20240127022', firstName: 'Mirriam', lastName: 'Njoki', email: 'njokimiriiam@gmail.com', password: '0712838387', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230221515', firstName: 'Nancy', lastName: 'Agiso', email: 'nancyagiso@gmail.com', password: '0718210643', role: 'staff', department: departments.STORES, position: 'stores in charge' },
  { employeeId: '20240127886', firstName: 'Olivia', lastName: 'Anyango', email: 'oliviaagla45@gmail.com', password: '0795425623', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20230236293', firstName: 'Pamela', lastName: 'Anyango', email: 'pameladanga381@gmail.com', password: '0797487738', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240146212', firstName: 'Pascal', lastName: 'Omondi', email: 'opasohazard@gmail.com', password: '0792470590', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240126864', firstName: 'Purity', lastName: 'Tungani', email: 'purity123@gmail.com', password: '0713626824', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240121262', firstName: 'Stavy', lastName: 'Awuor', email: 'stavyotieno@gmail.com', password: '0716842889', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240128078', firstName: 'Titus', lastName: 'Mutinda', email: 'titusmbatha45@gmail.com', password: '0702210078', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
  { employeeId: '20240136225', firstName: 'Zipporah', lastName: 'Kerubo', email: 'zipkerubo6@gmail.com', password: '0705271048', role: 'staff', department: departments.ENVIRONMENT, position: 'support staff' },
];

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany({});

    const createdUsers = [];

    for (const u of usersData) {
      const user = new User({
        ...u,
        password: u.password
      });
      await user.save();
    }


    const admin = createdUsers.find(u => u.role === 'admin');

    for (const user of createdUsers) {
      if (user.role !== 'admin') {
        user.supervisor = admin._id;
        await user.save();
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedUsers();

