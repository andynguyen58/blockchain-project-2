import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function () {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  setStatus: function (message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  createStar: async function () {
    const { createStar } = this.meta.methods;
    const name = document.getElementById("starName").value;
    const id = document.getElementById("starId").value;
    console.log({name, id})
    await createStar(name, id).send({ from: this.account });
    App.setStatus("New Star Owner is " + this.account + ".");
  },

  // Implement Task 4 Modify the front end of the DAPP
  lookUp: async function () {
    const { lookUptokenIdToStarInfo } = this.meta.methods;
    const id = document.getElementById("lookid").value;
    const starName = await lookUptokenIdToStarInfo(id).call();

    let status;
    if (starName === "") {
      status = "Star does not exist " + id;
    } else {
      status = `${starName}: ${id}`;
    }

    App.setStatus(status);
  },

  // Implement Task 1
  exchangeStars: async function () {
    let star1Id = document.getElementById("exchange[star1][id]");
    let star2Id = document.getElementById("exchange[star2][id]");
    let star1IdValue = parseInt(star1Id.value);
    let star2IdValue = parseInt(star2Id.value);

    if (!star1IdValue) {
      this.setStatusExchange("Star 1 ID is required.");
      return;
    }
    if (star1IdValue <= 0) {
      this.setStatusExchange("Star 1 ID must be greater than 0.");
      return;
    }
    if (!star2IdValue) {
      this.setStatusExchange("Star 2 ID is required.");
      return;
    }
    if (star2IdValue <= 0) {
      this.setStatusExchange("Star 2 ID must be greater than 0.");
      return;
    }
    if (star1IdValue === star2IdValue) {
      this.setStatusExchange("Star 1 ID and Star 2 ID must be different.");
      return;
    }

    if (this.meta) {
      let { exchangeStars } = this.meta.methods;
      let self = this;

      try {
        await exchangeStars(star1IdValue, star2IdValue)
          .send({ from: this.account })
          .then(function (result, error) {
            console.log({ then: true, error, result });
            if (error === undefined) {
              self.setStatusExchange("Done");
            } else {
              self.setStatusExchange(error.message);
            }
          })
          .catch(function (error) {
            console.log({ catch: true, error });
            let message = error.message || error.stack;
            self.setStatusExchange(message);
          });
      } catch (error) {
        this.setStatusExchange(error.message);
      }
    }
  },

  // Implement Task 1: transferStar
  transferStar: async function () {
    let transferInput = {
      to_address: document.getElementById("transfer[input][to_address]").value,
      starId: document.getElementById("transfer[input][star_id]").value,
    };

    if (!transferInput.to_address) {
      this.setStatusTransfer("to_address is missing");
      return;
    }
    if (!transferInput.starId) {
      this.setStatusTransfer("starId is missing");
      return;
    }
    if (transferInput.starId <= 0) {
      this.setStatusTransfer("starId invalid");
      return;
    }

    if (this.meta) {
      let { transferStar } = this.meta.methods;
      let self = this;

      try {
        await transferStar(transferInput.to_address, transferInput.starId)
          .send({ from: this.account })
          .then(function (result, error) {
            console.log({ then: true, error, result });
            if (error === undefined) {
              self.setStatusTransfer("Success!");
            } else {
              self.setStatusTransfer(error.message);
            }
          })
          .catch(function (error) {
            console.log({ catch: true, error });
            let message = error.message || error.stack;
            self.setStatusTransfer(message);
          });
      } catch (error) {
        this.setStatusTransfer(error.message);
      }
    }
  },
};

window.App = App;

window.addEventListener("load", async function () {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    await window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live"
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:9545")
    );
  }

  App.start();
});
