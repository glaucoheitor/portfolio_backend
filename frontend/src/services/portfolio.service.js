export const getTrades = async (authData) => {
  try {
    const { data } = await fetch("http://localhost:3001/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: `query {
              tradesByUserId(userId:"${authData.userId}") {
                type
                date
                qty
                price
                symbol {
                  _id
                  symbol
                  companyName
                }
              }
            }`,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authData.token,
      },
    }).then((res) => res.json());
    return data.tradesByUserId;
  } catch (e) {
    return [];
  }
};

export const getHistoricalStockData = async (
  authData,
  symbol,
  startDate,
  endDate
) => {
  try {
    const { data } = await fetch(
      `http://localhost:3001/historical?symbol=${symbol}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authData.token,
        },
      }
    ).then((res) => res.json());

    return data;
  } catch (e) {
    return [];
  }
};

export const getPositionAtDay = (symbolId, date, trades) => {
  const position = {
    total: 0,
    totalQty: 0,
    precoMedio: 0,
    priceAtDay: null,
  };
  for (const trade of trades) {
    if (symbolId === trade.symbol._id && trade.date <= new Date(date)) {
      if (trade.type === "buy") {
        position.total += Number(trade.qty) * Number(trade.price);
        position.totalQty += Number(trade.qty);
        position.precoMedio = position.total / position.totalQty;
      } else if (trade.type === "sell") {
        position.total -= Number(trade.qty) * position.precoMedio;
        position.totalQty -= Number(trade.qty);
      }
    }
  }
  return position;
};

export const buildPortfolioFromTrades = (trades) => {
  let portfolio = {};
  for (const trade of trades) {
    const s = trade.symbol._id;
    if (!portfolio.hasOwnProperty(s)) {
      portfolio[s] = {
        symbol: trade.symbol.symbol,
        companyName: trade.symbol.companyName
          ? trade.symbol.companyName
          : trade.symbol.symbol,
        total: 0,
        totalQty: 0,
        precoMedio: 0,
        currentPrice: null,
        previousPrice: null,
      };
    }
    if (trade.type === "buy") {
      portfolio[s].total += Number(trade.qty) * Number(trade.price);
      portfolio[s].totalQty += Number(trade.qty);
      portfolio[s].precoMedio = portfolio[s].total / portfolio[s].totalQty;
    } else if (trade.type === "sell") {
      portfolio[s].total -= Number(trade.qty) * portfolio[s].precoMedio;
      portfolio[s].totalQty -= Number(trade.qty);
    }
  }
  return sortAndReducePortfolio(portfolio);
};

export const getPrices = async (symbol) => {
  try {
    const data = await fetch("http://localhost:3001/getCurrentPrices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol }),
    }).then((res) => res.json());

    return data;
  } catch (e) {
    return {
      currentPrice: null,
      historical: {},
      previousPrice: null,
      priceChangePercent: null,
    };
  }
};

export const getIBOV = async () => {
  try {
    const data = await fetch("http://localhost:3001/ibov", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    return data;
  } catch (e) {
    return {
      currentPrice: null,
      historical: {},
      previousPrice: null,
      priceChangePercent: null,
    };
  }
};

const sortAndReducePortfolio = (trades) => {
  return Object.entries(trades)
    .sort(([, a], [, b]) => {
      if (a.symbol > b.symbol) {
        return 1;
      }
      if (a.symbol < b.symbol) {
        return -1;
      }
      return 0;
    })
    .reduce((obj, [symbolId, data]) => {
      if (data.totalQty > 0) {
        obj[symbolId] = trades[symbolId];
      }
      return obj;
    }, {});
};
