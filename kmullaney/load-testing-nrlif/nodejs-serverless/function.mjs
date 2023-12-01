const basePumpkin = [
  "  ,--./,--.",
  " / #      \\",
  "|          |",
  " \\        /",
  "  `.___.'"
]

const eyes = [
  ["0", "0"],
  ["O", "O"],
  ["o", "o"],
]

const mouths = [
  "  \\        /",
  "   \\  __  /",
  "    \\    /"
]

function displayPumpkinPatch(numPumpkins) {
  let pumpkins = [];

  for (let i = 0; i < numPumpkins; i++) {
    let pumpkin = [...basePumpkin];
    const eyeIndex = Math.floor(Math.random() * eyes.length);
    const mouthIndex = Math.floor(Math.random() * mouths.length);

    pumpkin[2] = pumpkin[2].replace(
      "          ",
      `  ${eyes[eyeIndex][0]}     ${eyes[eyeIndex][1]}  `
    );
    pumpkin[3] = pumpkin[3].replace(" \\        /", mouths[mouthIndex]);

    pumpkins.push(pumpkin.join('\n'));
  }

  return pumpkins;
}

const handler = async (event) => {
  const numPumpkins = event.numPumpkins || 1000; // Use default value if not provided
  const pumpkinPatch = displayPumpkinPatch(numPumpkins);

  pumpkinPatch.forEach((pumpkin, i) => {
    console.log(`Pumpkin ${i + 1}:\n${pumpkin}\n`);
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Pumpkin patch generated!',
      pumpkinPatch,
    }),
  };
};

export { handler }
