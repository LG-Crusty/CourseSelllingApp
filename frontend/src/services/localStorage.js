export class LocalStorageClass {
  setinStorage(name, data) {
    const reqData = JSON.stringify(data);
    localStorage.setItem(name, reqData);
    console.log("successfully set in storage ");
  }

  getfromStorage(name) {
    const data = JSON.parse(localStorage.getItem(name));
    return data;
  }

  removefromStorage(name) {
      localStorage.removeItem(name);
      console.log("item successfully removed")
  }

  cleartheStorage() {
      localStorage.clear();
      console.log("data successfully cleared")
  }
}

const localStorageService = new LocalStorageClass()

export default localStorageService ;