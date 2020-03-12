$(document).ready(function () {
  const watchAside = $('#watchAside')

  let listSelect = []
  let watchlists = []

  getWatchlists()

  function initializeRows (arr) {
    watchAside.empty()
    const rowsToAdd = []
    rowsToAdd.push(createNewRow(arr))
  }

  function getWatchlists () {
    $.get('/api/watchlist', function (data) {
      const array = []
      data.forEach(element => {
        if (element.isWatchlist) {
          watchlists = element.groupName
          array.push(watchlists)
        }
      })
      listSelect = []
      listSelect = array
      initializeRows(array)
    })
  }

  function createNewRow (arr) {
    for (let i = 0; i < arr.length; i++) {
      const newInputRow = $(`
        <li data-ticker="${arr[i]}">
          <a>
            ${arr[i]}
          </a>
        </li>`
      )
      watchAside.append(newInputRow)
    }
  }

  // populates the dropdown list when adding to watchlist
  function createNewList (arr) {
    $('#mySelect').empty()
    for (let i = 0; i < listSelect.length; i++) {
      console.log('createnewrow2 fx: ', listSelect[i])
      $('#mySelect').append('<option value=' + listSelect[i] + '> ' + listSelect[i] + ' </option>')
    }
  }

  $('#newListBtn').on('click', function (event) {
    event.preventDefault()
    const newGroup = $('#listInput').val()
    insertNewGroup({ groupName: newGroup })
    $('#listInput').val('')
  })

  function insertNewGroup (listData) {
    $.post('/api/watchlist', listData).then(getWatchlists)
  }

  $('body').on('click', '#saveWL', function (event) {
    event.preventDefault()
    const GroupSearched = $('#mySelect option:selected').text().trim()
    const symbol = $('#saveWL').data('symbol')

    $.ajax('/api/watchlist/save', {
      type: 'POST',
      data: {
        group: GroupSearched,
        symbol: symbol
      }
    }).then(
      function (response) {
        console.log('API response', response)
        console.log('added stock to watchlis db')
      }
    )
  })

  $('#searchForm').on('submit', function (event) {
    event.preventDefault()
    var ticker = $('#tickerInput').val()
    $('#tickerInput').val('')
    const isRegexTrue = /^[a-zA-Z]+$/.test(ticker)
    if (!isRegexTrue) {
      $('#watchlistContent').empty()
      $('#watchlistContent').html('Invalid search input')
    } else {
      $.ajax('/api/watchlist/search/' + ticker, {
        type: 'GET',
        error: function (err) {
          $('#watchlistContent').empty()
          $('#watchlistContent').html(err.statusText + ': Invalid symbol')
        }
      }).then(
        function (response) {
          createMessage(response)
          createChart(response)
        }
      )
    }
  })
  // Handles displaying data when watchlist is clicked
  watchAside.on('click', 'li', function (event) {
    const clickedWatchlist = this.dataset.ticker
    $.ajax('/api/watchlist/' + clickedWatchlist, {
      type: 'GET',
      error: function (err) {
        $('#watchlistContent').empty()
        $('#watchlistContent').html(err.statusText + ': No stocks saved in the ' + clickedWatchlist + ' watchlist')
      }
    }).then(function (response) {
      $('#watchlistContent').empty()
      const beginColumns = $('<div class="columns is-multiline" id="watchlistColumns">')
      const columnHeader = $(`<div class="column is-12 has-text-centered has-text-info title"><span id='groupTitle' data-group="${clickedWatchlist}">${clickedWatchlist}</span></div>`)
      $('#watchlistContent').append(columnHeader, beginColumns)
      for (const key in response) {
        const ApiObj = response[key].quote
        const percentYtd = (ApiObj.ytdChange * 100).toFixed(1)
        const data = {
          company: ApiObj.companyName,
          symbol: ApiObj.symbol,
          exchange: ApiObj.primaryExchange,
          currentPrice: ApiObj.latestPrice,
          open: ApiObj.open,
          high: ApiObj.close,
          low: ApiObj.low,
          low52: ApiObj.week52Low,
          high52: ApiObj.week52High,
          marketCap: ApiObj.marketCap,
          ytdChange: percentYtd,
          isUSMarketOpen: ApiObj.isUSMarketOpen
        }
        createWatchlist(data)
      }
      const endColumns = $(`</div>
      </div>`)
      $('#watchlistContent').append(endColumns)
    })
  })
  // Attaches event listener to delete button
  // handles delete stock functionality
  $('#watchlistContent').on('click', 'button', function (event) {
    event.preventDefault()
    const symbol = this.dataset.symbol
    const group = $('#groupTitle').data('group')
    console.log('group: ', group)
    // console.log('clickedwatchlist: ', clickedWatchlist)
    deleteStock(symbol, group)
  })
  function createMessage (data) {
    const newMessage = $(`<article class="message">
    <div class="columns">
      <div class="column">
        <div class="message-header">
          ${data[0].company}
        </div>
        <div class="message-body">
          <ul>
          <li>${data[0].exchange} - ${data[0].symbol}</li>
          <li>Price: ${data[0].currentPrice} USD</li>
          <li>Open: ${data[0].open} </li>
          <li>High: ${data[0].high} </li>
          <li>Low: ${data[0].low} </li>
          <li>52-wk High: ${data[0].high52} </li>
          <li>52-wk Low: ${data[0].low52} </li>
          <li>Market Cap: ${data[0].marketCap} </li>
          <li>YTD%: ${data[0].ytdChange} </li>
          </ul>
        <br>
        <div class="field is-horizontal">
            <div class="field-label">
              <label class="label">Add To Watchlist</label>
            </div>
            <div class="field-body">
              <div class="field has-addons">
                <p class="control has-icons-left">
                  <span class="select" >
                    <select id="mySelect">
                      <option selected>Country</option>
                      <option>Select dropdown</option>
                      <option>With options</option>
                    </select>
                  </span>
                  <span class="icon is-small is-left">
                    <i class="fas fa-chart-line"></i>
                  </span>
                </p>
                <div class="control">
                  <button type="submit" id="saveWL"  data-symbol="${data[0].symbol}" class="button is-info">
                    <span class="icon">
                      <i class="fas fa-plus"></i>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="column">
        <div id="chartContainer" style="height: 300px; width: 100%;">
        </div>
      </div>
    </div>
  </article>`)
    $('#watchlistContent').empty()
    $('#watchlistContent').append(newMessage)
    createNewList()
  }
  function createChart (data) {
    // console.log(data[1])
    data[1].forEach(el => {
      // console.log(el.x)
      el.x = new Date(el.x)
    })
    for (let i = 0; i < data[1].length; i++) {
      // eslint-disable-next-line no-undef
      var chart = new CanvasJS.Chart('chartContainer', {
        animationEnabled: true,
        theme: 'dark2', // "light1", "light2", "dark1", "dark2"
        exportEnabled: true,
        title: {
          text: data[0].company
        },
        axisX: {
          intervalType: 'day',
          valueFormatString: 'MM DD YYYY'
        },
        axisY: {
          includeZero: false,
          prefix: '$',
          title: 'Price'
        },
        toolTip: {
          content:
            'Date: {x}<br /><strong>Price:</strong><br />Open: {y[0]}, Close: {y[3]}<br />High: {y[1]}, Low: {y[2]}'
        },
        data: [
          {
            type: 'candlestick',
            yValueFormatString: '$##0.00',
            dataPoints: data[1],
            xValueType: 'dateTime',
            risingColor: '#66ff33',
            color: '#ff0000'
          }
        ]
      })

      chart.render()
    }
  }

  function createWatchlist (data) {
    const columnsContent = $(`<div class="column is-half">
  <article class="message">
  <div class="message-header">
    ${data.company}
    <span class="tag">Delete
    <button class="delete deleteBTN" aria-label="delete" data-symbol="${data.symbol}"></button>
    </span>
  </div>
  <div class="message-body">
  <ul>
  <li>${data.exchange} - ${data.symbol}</li>
  <li><span id="priceEmphasis">${data.currentPrice}</span> USD</li>
  <li>Open: ${data.open}</li>
  <li>High: ${data.high}</li>
  <li>Low: ${data.low}</li>
  <li>52-wk High: ${data.high52}</li>
  <li>52-wk Low: ${data.low52}</li>
  <li>Market Cap: ${data.marketCap}</li>
  <li>YTD: ${data.ytdChange}%</li>
  </ul>
  </div>
  </article>
  </div>`)
    $('#watchlistColumns').append(columnsContent)
  }
  function deleteStock (stock, group) {
    // AJAX to backend
    $.ajax('/api/watchlist/delete/', {
      type: 'POST',
      data: {
        stock: stock,
        group: group
      },
      error: function (err) {
        $('#watchlistContent').empty()
        $('#watchlistContent').html(err.statusText + ': No stocks saved in the ' + group + ' watchlist')
      }
    }).then(function (response) {
      console.log('response: ', response)
      $('#watchlistContent').empty()
      const beginColumns = $('<div class="columns is-multiline" id="watchlistColumns">')
      const columnHeader = $(`<div class="column is-12 has-text-centered has-text-info title"><span id='groupTitle' data-group="${group}">${group}</span></div>`)
      $('#watchlistContent').append(columnHeader, beginColumns)
      for (const key in response) {
        const ApiObj = response[key].quote
        const percentYtd = (ApiObj.ytdChange * 100).toFixed(1)
        const data = {
          company: ApiObj.companyName,
          symbol: ApiObj.symbol,
          exchange: ApiObj.primaryExchange,
          currentPrice: ApiObj.latestPrice,
          open: ApiObj.open,
          high: ApiObj.close,
          low: ApiObj.low,
          low52: ApiObj.week52Low,
          high52: ApiObj.week52High,
          marketCap: ApiObj.marketCap,
          ytdChange: percentYtd,
          isUSMarketOpen: ApiObj.isUSMarketOpen
        }
        createWatchlist(data)
      }
    })
  }
})
