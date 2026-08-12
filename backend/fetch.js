fetch("http://localhost:5001/api/vendor/farmers/farmer-1/harvest-orders")
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
  })
  .catch(err => console.error(err));
