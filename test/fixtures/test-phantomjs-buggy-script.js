console.log('wait for 2.5 s')
setTimeout(function () {
  console.log('then fail with an epic error')
  throw 'tomate'
}, 2500);
