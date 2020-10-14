const Sequelize = require('sequelize');
const { Op } = Sequelize;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite3'
});

class Profile extends Sequelize.Model {
  async downBalance (amount) {
    this.balance -= amount;
    return this.save();
  }

  async upBalance (amount) {
    this.balance += amount;
    return this.save();
  }
}

Profile.init(
  {
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    profession: {
      type: Sequelize.STRING,
      allowNull: false
    },
    balance:{
      type:Sequelize.DECIMAL(12,2)
    },
    type: {
      type: Sequelize.ENUM('client', 'contractor')
    }
  },
  {
    sequelize,
    modelName: 'Profile'
  }
);

class Contract extends Sequelize.Model {
  static async getProfileContract (contractId, profileId, profileType) {
    const profileCondition = () => {
      if (profileType === 'client') {
        return {
          ClientId: profileId
        }
      } else if (profileType === 'contractor') {
        return  {
          ContractorId: profileId
        }
      }
    }

    let condition = {
      where: {
        [Op.and]: {
          id: contractId,
          ...profileCondition()
        }
      }
    }


    return await this.findOne(condition)
  }

  static async getActiveProfileContracts (profileId) {
    const whereClause = {
      where: {
        [Op.and]: [
          {
            status: {
              [Op.not]: 'terminated'
            }
          },
          {
            [Op.or]: [
              { ClientId: profileId },
              { ContractorId: profileId },
            ]
          }
        ]
      }
    }

    return await this.findAll(whereClause);
  }
}

Contract.init(
  {
    terms: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status:{
      type: Sequelize.ENUM('new','in_progress','terminated')
    }
  },
  {
    sequelize,
    modelName: 'Contract'
  }
);

class Job extends Sequelize.Model {
  static async getUnpaidJobs (contractIds) {
    const whereClause = {
      where: {
        [Op.and]: {
          ContractId: {
            [Op.or]: contractIds
          }
        },
        paid: {
          [Op.or]: [
            {
              [Op.is]: null
            },
            {
              [Op.is]: false
            }
          ]
        }
      }
    }

    return await Job.findAll(whereClause);
  }

  async pay () {
    this.paid = true;
    return this.save();
  }
}

Job.init(
  {
    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    price:{
      type: Sequelize.DECIMAL(12,2),
      allowNull: false
    },
    paid: {
      type: Sequelize.BOOLEAN,
      default:false
    },
    paymentDate:{
      type: Sequelize.DATE
    }
  },
  {
    sequelize,
    modelName: 'Job'
  }
);

Profile.hasMany(Contract, {as :'Contractor',foreignKey:'ContractorId'})
Contract.belongsTo(Profile, {as: 'Contractor'})
Profile.hasMany(Contract, {as : 'Client', foreignKey:'ClientId'})
Contract.belongsTo(Profile, {as: 'Client'})
Contract.hasMany(Job)
Job.belongsTo(Contract)

module.exports = {
  sequelize,
  Profile,
  Contract,
  Job
};
