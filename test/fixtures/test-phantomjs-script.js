console.log('wait for 2.5 s')
setTimeout(function () {
  console.log('then sends out message to indicate its all done')
  console.log(window.pageResToken)
}, 2500);
