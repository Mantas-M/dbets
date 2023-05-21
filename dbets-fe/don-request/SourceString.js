export default `if (!secrets.awsLink) {
  throw Error("did not get the link")
}

const awsLink = secrets.awsLink

const numberRequest = Functions.makeHttpRequest({
  url: awsLink,
})

const numberResponse = await numberRequest

let number

if (!numberResponse.error) {
  console.log(numberResponse.data)
  number = Number(numberResponse.data.number)
} else {
  throw Error("res error", numberResponse.error)
}
return Functions.encodeUint256(number)
`;
