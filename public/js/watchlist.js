$(document).ready(function () {
  const watchAside = $('#watchAside')
  const newListInput = $('#listInput')
  console.log(newListInput.val())

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
      console.log(array)
      initializeRows(array)
    })
  }

  function createNewRow (arr) {
    console.log('createnewrow fx: ', watchlists)
    for (let i = 0; i < arr.length; i++) {
      console.log(arr[i])
      const newInputRow = $(
        ['<li>', '<span>' + '<a>' + arr[i] + '</a>' + '</span>', '</li>'].join(
          ''
        )
      )
      watchAside.append(newInputRow)
    }
  }

  $('#newListBtn').on('click', function (event) {
    event.preventDefault()
    const newGroup = $('#listInput').val()
    insertNewGroup({ groupName: newGroup })
  })

  function insertNewGroup (listData) {
    console.log(listData)
    $.post('/api/watchlist', listData).then(getWatchlists)
  }

  $('#tickerBtn').on('click', function (event) {
    var ticker = $('#tickerInput').val()

    // Send the PUT request.
    $.ajax('/api/watchlist/search/' + ticker, {
      type: 'GET'
    }).then(
      function (response) {
        console.log('API response', response)
        createMessage(response)
        // Reload the page to get the updated list
        // location.reload();
      }
    )
  })
  function createMessage (data) {
    const newMessage = $(`<article class="message">
    <div class="message-header">
      ${data.company}
      <button class="delete" aria-label="delete"></button>
    </div>
    <div class="message-body">
    <ul>
    <li>${data.symbol}</li>
    <li>${data.exchange}</li>
    <li>${data.currentPrice}</li>
    <li>CANVAS CHART GOES HERE</li>
    </ul>
    <a class="button is-info" id="newListBtn">
                    Add to watchlist
                </a>
    </div>
  </article>`)
    $('#watchlistContent').append(newMessage)
  }
})