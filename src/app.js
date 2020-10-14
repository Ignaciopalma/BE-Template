const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.get('/contracts/:id',getProfile ,async (req, res) =>{
    const {Contract} = req.app.get('models')
    const contract = await Contract.getProfileContract(req.params.id, req.profile.id, req.profile.type)

    if(!contract) return res.status(404).end()
    res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')

    const contracts = await Contract.getActiveProfileContracts(req.profile.id);
    const response = contracts.map(contract => contract.dataValues)
    return res.send(response)
})

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const { Job, Contract } = req.app.get('models')

    const profileActiveContracts = await Contract.getActiveProfileContracts(req.profile.id);
    const contractsIds = profileActiveContracts.map(activeContract => activeContract.id);
    const jobs = await Job.getUnpaidJobs(contractsIds);
    const response = jobs.map(job => job.dataValues)
    return res.send(response)
})

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    const { Job, Contract, Profile } = req.app.get('models')
    const jobId = req.params.job_id;
    const job = await Job.findOne({ where: { id: jobId } })
    const contract = await Contract.findOne({ where: { id: job.ContractId } })
    const contractor = await Profile.findOne({ where: { id: contract.ContractorId } })

    if (req.profile.balance >= job.price) {
      // Should be a transaction query...

      await job.pay();
      await req.profile.downBalance(job.price);
      await contractor.upBalance(job.price);
    }
})

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
})

app.get('/admin/best-profession?start=<date>&end=<date>', getProfile, async (req, res) => {
})

app.get('/admin/best-clients?start=<date>&end=<date>&limit=<integer>', getProfile, async (req, res) => {
})

module.exports = app;
