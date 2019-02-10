var web3 = require('web3');

const PokerTournament = artifacts.require('./PokerTournament.sol');
const truffleAssert = require('truffle-assertions');

contract('PokerTournament', async accounts => {

  let pokerTournament;
  const VALUE = 10;

  beforeEach(async () => {
    pokerTournament = await PokerTournament.new({ from: accounts[0] });
  });

  describe('initialization', () => {
    it('all get-functions should be initialized as 0', async () => {
      assert.equal(await pokerTournament.buyIn(), 0);
      assert.equal(await pokerTournament.getPlayerCount(), 0);
      assert.equal(await pokerTournament.prizePool(), 0)
    });
  })
  describe('interaction', () => {
    it('should return correct buy-in', async () => {
      await pokerTournament.deposit({ value: VALUE } );
      assert.equal(await pokerTournament.buyIn(), Math.ceil(VALUE * 3/4));
    });

    it('should return correct prize pool', async () => {
      await pokerTournament.deposit({from: accounts[0], value: VALUE });
      await pokerTournament.deposit({from: accounts[1], value: VALUE });

      assert.equal(await pokerTournament.prizePool(), Math.ceil(VALUE * 3/4) + Math.ceil(VALUE * 3/4));
    });

    it('should return correct player count', async () => {
      await pokerTournament.deposit({from: accounts[0], value: VALUE });
      await pokerTournament.deposit({from: accounts[1], value: VALUE });
      assert.equal(await pokerTournament.getPlayerCount(), 2);
    });

    it('should return correct amount of players that has voted', async () => {
      for(let i = 0; i < 7; i++){
        await pokerTournament.deposit({from: accounts[i], value: VALUE });
      }
      await pokerTournament.voteForWinner([`${accounts[0]}`], {from: accounts[0]})
      assert.equal(await pokerTournament.getPlayersVotedCount(), 1);
    });

    it('Should return the correct potium size', async () => {
      for(let i = 0; i < 5; i++){
        await pokerTournament.deposit({from: accounts[i], value: VALUE });
      }
      assert.equal(await pokerTournament.getPotiumSize(), 1);
    });


    it.skip('tests', async () => {
      await pokerTournament.testa({from: accounts[0]});
      // assert.equal(await pokerTournament.getPotiumSize(), 1);
    });


    it('Should reset the prizePool after everybody voted, potium: 1', async () => {
      for(let i = 0; i < 5; i++){
        await pokerTournament.deposit({from: accounts[i], value: VALUE });
      }
      for(let i = 0; i < 5; i++){
        await pokerTournament.voteForWinner([`${accounts[0]}`], {from: accounts[i], gas: "200000" }).catch((err) => console.log(err));
      }
      let prizePool = (await pokerTournament.prizePool()).toNumber();
      let depositPool = (await pokerTournament.depositPool()).toNumber();

      assert.equal(prizePool, 0);
      assert.equal(depositPool, 0);
      assert.equal(await pokerTournament.votingEnded(), true);
      assert.equal(await pokerTournament.getContractBalance(), 0);
    });

    it.only('Should reset the prizePool after everybody voted, potiumSize: 2', async () => {
      for(let i = 0; i < 10; i++){
        await pokerTournament.deposit({from: accounts[i], value: VALUE });
      }
      for(let i = 0; i < 10; i++){
        await pokerTournament.voteForWinner([`${accounts[0]}`, `${accounts[1]}`], {from: accounts[i], gas: "200000" });
      }
      let prizePool = (await pokerTournament.prizePool()).toNumber();
      let depositPool = (await pokerTournament.depositPool()).toNumber();

      assert.equal(prizePool, 0);
      assert.equal(depositPool, 0);
      assert.equal(await pokerTournament.votingEnded(), true);
      assert.equal(await pokerTournament.getContractBalance(), 0);
    });
  })

  describe('helpers', () => {
    it('should not be equal', async () => {
      let isNotEqual = await pokerTournament.isEqual([`${accounts[0]}`], [`${accounts[1]}`]);
      assert.equal(isNotEqual, false);
    });
    it('should be equal', async () => {
      let isEqual = await pokerTournament.isEqual([`${accounts[0]}`], [`${accounts[0]}`]);
      assert.equal(isEqual, true);
    });
  });

  describe('limitations', async () => {
    it('should throw an error if the same address tries to deposit again', async () => {
      await pokerTournament.deposit({ value: VALUE } );
      await truffleAssert.reverts(
        pokerTournament.deposit({ value: VALUE }),
        "A player can only deposit once."
      );
    });
    it('should throw an error if an outside accounts tries to vote', async () => {
      await truffleAssert.reverts(
        pokerTournament.voteForWinner([`${accounts[0]}`], {from: accounts[0] }),
        "Voter should be participating."
      );
    });
    it('should throw an error if the same address tries to vote again', async () => {
      for(let i = 0; i < 5; i++){
        await pokerTournament.deposit({from: accounts[i], value: VALUE });
      }
      await pokerTournament.voteForWinner([`${accounts[0]}`], {from: accounts[0], gas: 3000000 });

      await truffleAssert.reverts(
        pokerTournament.voteForWinner([`${accounts[0]}`], {from: accounts[0], gas: 3000000 }),
        "A player can only vote once."
        );
    });
    it('should throw an error if the amount of address voted for doesnt match potium size', async () => {
      await pokerTournament.deposit({from: accounts[0], value: VALUE });
      await truffleAssert.reverts(
        pokerTournament.voteForWinner([`${accounts[0]}`, `${accounts[1]}`], {from: accounts[0]}),
        "The amount of addresses in player ballot has to match the potium size."
      )
    });
    it('should throw an error if deposit amount doesnt match buy-in', async () => {
      await pokerTournament.deposit({from: accounts[0], value: VALUE });
      await truffleAssert.reverts(
        pokerTournament.deposit({from: accounts[1], value: 15 }),
        "Value sent to contract has to match the buy-in + deposit amount."
      )
    });
  })
});
