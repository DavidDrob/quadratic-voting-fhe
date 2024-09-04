import React, { useState } from "react";

function hexToDateTimeString(data) {
    const hex = data._hex;
    const isBigNumber = data._isBigNumber;

    // Convert BigNumber hex or regular hex to a decimal timestamp
    const decimalTimestamp = isBigNumber 
        ? parseInt(hex, 16)
        : Number(hex);

    // Convert timestamp to milliseconds if it's in seconds
    const date = new Date(decimalTimestamp * 1000);

    // Return a human-readable date-time string
    return date.toLocaleString();
}


export function Voting({ vote, data }) {
  const [inputValues, setInputValues] = useState({});
  const options = [];

  const updateInputMapping = (index) => (e) => {
    const value = parseInt(e.target.value);
    setInputValues((prevValues) => ({
      ...prevValues,
      [index]: value
    }));
  };

  const getTotalSquared = () => {
      let sum = 0;
      for (let val in inputValues) {
          sum += inputValues[val]**2;
      }

      return sum;
  }

  for (let i = 0; i < data.options.length; i++) {
    options.push(
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "30%" }}>Option #{i}</div>
            <input
                style={{ width: "30%" }}
                defaultValue={0} 
                onChange={updateInputMapping(i)}
                type="number" className="form-control" id={i}></input>
            <div style={{ width: "40%" }}>Cost: {isNaN(inputValues[i] ** 2) ? 0 : inputValues[i] ** 2}MTK</div>
        </div>
    );
  }

  return (
    <div className="card p-2">
      <h4 className="card-title"> Voting #{ data.id }</h4>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <p className="m-0">from: { hexToDateTimeString(data.startDate) }</p>
        <p className="m-0">to: { hexToDateTimeString(data.endDate) }</p>
      </div>
      <h5 className="mt-2">Vote</h5>
      {options}

      <div style={{ display: "flex", flexDirection: "column" }}>
        <p className="mt-2 mb-0"> Total cost: {getTotalSquared()}MTK </p>
        <button type="submit" className="btn btn-warning" onClick={() => vote(inputValues)}>Submit Voting</button>
      </div>
    </div>
  );
}
