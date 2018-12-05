async function inputData () {
  return await d3.json('src/data/table_input.json')
}

// Метод для получения последнего элемента массива
if (!Array.prototype.last) {
  Array.prototype.last = function () {
    return this[this.length - 1]
  }
}

// Временную строку в число секунд
function timestrToSec (timestr) {
  const parts = timestr.split(':')
  return parts[0] * 3600 + parts[1] * 60 + +parts[2]
}

function roundToTwo (str) {
  return +str.toFixed(2)
}

const HOURS_IN_DAY = 24
const SEC_IN_HOUR = 3600
const SEC_IN_DAY = HOURS_IN_DAY * SEC_IN_HOUR
const CITIES = [
  'Анциферово',
  'Батецкий',
  'Ближнее Заполье',
  'Боровичи',
  'Валдай',
  'Великий Новгород',
  'Висленев Остров',
  'Волот',
  'Воронино',
  'Глухачи',
  'Залучье',
  'Кабожа',
  'Ильина Гора',
  'Калитино',
  'Лубенское',
  'Лычково',
  'Любытино',
  'Малая Вишера',
  'Мелехово',
  'Мокрый Остров',
  'Мошенское',
  'Новинка',
  'Новое Овсино',
  'Переходы',
  'Пестово',
  'Полново',
  'Пролетарий',
  'Старая Каменка',
  'Старая Русса',
  'Тёсовский',
  'Тугино',
  'Угловка',
  'Хвойная',
  'Холм',
  'Яжелбицы'
]

// время всей остановки
function getDurInHour (time) {
  return roundToTwo(timestrToSec(time) / SEC_IN_HOUR)
}

// время от остановки на конец текущего дня
function getHourOnThisDayEnd (time) {
  return roundToTwo((SEC_IN_DAY - timestrToSec(time)) / SEC_IN_HOUR)
}

// время от остановки на начало следующего дня
function getHourOnNextDayStart (start, end) {
  return roundToTwo(
    (timestrToSec(start) + timestrToSec(end) - SEC_IN_DAY) / SEC_IN_HOUR
  )
}

function copyTable (id) {
  window.getSelection().removeAllRanges()
  const table = document.getElementById(id)
  const range = document.createRange()
  range.selectNode(table)
  window.getSelection().addRange(range)

  try {
    const successful = document.execCommand('copy')
    const msg = successful ? 'successful' : 'unsuccessful'
    alert('Copy table command was ' + msg)
  } catch (err) {
    alert('Oops, unable to copy')
  }

  window.getSelection().removeAllRanges()
}

function copyOutputTable () {
  copyTable('output-table')
}

// ===== ФУНКЦИИ ОТРИСОВКИ ТАБЛИЦ =====
function renderInputTable (data) {
  const table = d3.select('#input-table').html('')
  const thead = table.append('thead')
  const tbody = table.append('tbody')
  const tfoot = table.append('tfoot')
  const columns = Object.keys(data[0])
  const totalHours = data
    .reduce((acc, cur) => {
      return acc + timestrToSec(cur.duration) / 3600
    }, 0)
    .toFixed(2)
  thead
    .append('tr')
    .selectAll('th')
    .data(columns)
    .enter()
    .append('th')
    .text(head => head)

  const rows = tbody
    .selectAll('tr')
    .data(data)
    .enter()
    .append('tr')
    .selectAll('td')
    .data(function (row) {
      return columns.map(function (column) {
        return { value: row[column] }
      })
    })
    .enter()
    .append('td')
    .text(function (d) {
      return d.value
    })

  const footer = tfoot.append('tr')
  footer
    .append('td')
    .attr('colspan', columns.length - 1)
    .text('Итого (ч):')
  footer.append('td').text(totalHours)
}

function renderOutputPable (data, daysInMonth, isFull = true) {
  const table = d3.select('#output-table').html('')
  const thead = table.append('thead')
  const tbody = table.append('tbody')
  const tfoot = table.append('tfoot')
  const tHeads = [
    'city',
    ...Array(daysInMonth)
      .fill()
      .map((n, i) => ++i),
    'Total',
    'Sum'
  ]
  const cities = Object.keys(data).sort()
  const rowsData = cities.map((city, i) => {
    const hours = Array(daysInMonth)
      .fill()
      .map((n, i) => {
        const val = data[city][++i]
        return {
          color: val < 24 ? '#3f3' : '#fff',
          value: val
        }
      })
    if (isFull) {
      const hoursTotal = roundToTwo(hours.reduce((a, c) => a + c.value, 0))
      const hoursSum = roundToTwo(HOURS_IN_DAY * daysInMonth - hoursTotal)
      return [cities[i], ...hours, hoursTotal, hoursSum]
    } else {
      return hours
    }
  })

  if (isFull) {
    thead
      .append('tr')
      .selectAll('th')
      .data(tHeads)
      .enter()
      .append('th')
      .text(head => head)
  }

  tbody
    .selectAll('tr')
    .data(rowsData)
    .enter()
    .append('tr')
    .selectAll('td')
    .data(function (row) {
      return row.map((r, i) => ({
        color: typeof row[i] === 'object' ? row[i].color : '#fff',
        value:
          typeof row[i] !== 'object'
            ? row[i]
            : roundToTwo(+row[i].value)
              .toString()
              .replace('.', ',')
      }))
    })
    .enter()
    .append('td')
    .text(d => d.value)
    .attr('style', d => 'background-color:' + d.color)

  if (isFull) {
    const total = roundToTwo(rowsData.reduce((a, c) => a + c.last(), 0))
    const footer = tfoot.append('tr')
    footer
      .append('td')
      .attr('colspan', tHeads.length - 1)
      .text('Итого (ч):')
    footer.append('td').text(total)
  }

  const buttons = d3.select('.buttons').html('')
  if (!isFull) {
    buttons
      .append('button')
      .text('Скопировать таблицу')
      .on('click', copyOutputTable)
  }
}
// ====================================

function getDaysInMonth (data) {
  const currDate = data[0].date.split('.')
  const [currMonth, currYear] = [currDate[1], currDate[2]]
  return new Date(currYear, currMonth, 0).getDate()
}

// inputData().then(data => {
function convertData (data) {
  // ===== ОТРИСОВКА ТАБЛИЦЫ С ВХОДНЫМИ ДАННЫМИ =====
  renderInputTable(data)
  // ================================================

  const DAYS_IN_MONTH = getDaysInMonth(data)

  // Создадим промежуточный объект с городами, в которых к каждой дате
  // прикреплен массив с началом и продолжительностью остановок за данную дату.
  // Этот объект упростит подсчёт остановок в одном городе за одну дату,
  // особенно если они стоят не подряд во входном массиве,
  // поскольку повторяющиеся города объединяются в свойства объекта,
  // а остановки накапливаются в свойствах-датах внутри этих городов.
  const middleData = {}
  // Заполним объект свойствами по названиям нас. пунктов с пустыми объектами внутри
  data.map(d => (middleData[d.city] = {}))

  for (d of data) {
    const day = +d.date.slice(0, 2)
    // Если в одной дате больше одной остановки
    if (middleData[d.city].hasOwnProperty(day)) {
      middleData[d.city][day].push({ beg: d.begin, dur: d.duration })
    } else {
      middleData[d.city][day] = [{ beg: d.begin, dur: d.duration }]
    }
  }

  // Сгенерируем выходной массив, свойствами которого будут города,
  // внутри которых будут объекты со свойствами-датами,
  // содержащими начальное количество часов в сутках.ы
  const outputData = {}
  for (city of CITIES) {
    outputData[city] = Object.assign(
      {},
      ...Array(DAYS_IN_MONTH)
        .fill(HOURS_IN_DAY)
        .map((a, i) => ({ [i + 1]: a }))
    )
  }

  //= ========= ОСНОВНОЙ ЦИКЛ ПРЕОБРАЗОВАНИЯ ==========
  for (city in middleData) {
    for (date in middleData[city]) {
      // thisDateErrors - массив объектов ошибок {beg, dur}
      const thisDateErrors = middleData[city][date]
      // thisDateErrorsSum - сумма всех остановок за данную дату
      let thisDateErrorsSum = 0

      // 1. Выбираем в качестве обрабатываемой остановки самую последнюю (даже если она одна)
      const thisError = thisDateErrors.last()

      // restHoursOnEnd - окончание остановки на следующие сутки
      let restHoursOnEnd = getHourOnNextDayStart(thisError.beg, thisError.dur)

      // 2. Остановка выходит за пределы текущей даты?
      if (restHoursOnEnd > 0) {
        // 2.1 Выделить часть остановки на текущую дату
        // restHoursOnStart - начало остановки на конец текущих суток
        const restHoursOnStart = getHourOnThisDayEnd(thisError.beg)

        // 2.2.1 Сложить все остановки в текущей дате
        const errorsExceptLast = thisDateErrors
          .slice(0, thisDateErrors.length - 1)
          .map(error => getDurInHour(error.dur))
        thisDateErrorsSum = [...errorsExceptLast, restHoursOnStart].reduce(
          (a, c) => a + c
        )

        // nextDatesNumber - количество целых следующих дней после начала остановки
        const nextDatesNumber = Math.floor(restHoursOnEnd / HOURS_IN_DAY)

        // 3. Остановка занимает 3 и более дат?
        if (nextDatesNumber > 0) {
          // 3.1 Обнуляем часы во всех промежуточных днях
          for (let i = 1; i <= nextDatesNumber; i++) {
            outputData[city][+date + i] = 0
          }
          restHoursOnEnd = restHoursOnEnd - nextDatesNumber * HOURS_IN_DAY
        }
        // 3.2 Вычитаем из последнего дня остаток остановки
        const nextDate = +date + nextDatesNumber + 1
        outputData[city][nextDate] = roundToTwo(
          outputData[city][nextDate] - restHoursOnEnd
        )
      } else {
        // 2.2.2 Сложить все остановки в текущей дате
        thisDateErrorsSum = thisDateErrors.reduce(
          (a, c) => a + getDurInHour(c.dur),
          0
        )
      }

      // 4. Вычесть из текущей даты все остановки
      outputData[city][date] = roundToTwo(
        outputData[city][date] - thisDateErrorsSum
      )
    }
  }
  //= =================================================

  // ===== ОТРИСОВКА ТАБЛИЦЫ С ВЫХОДНЫМИ ДАННЫМИ =====
  renderOutputPable(outputData, DAYS_IN_MONTH)

  d3.select('#output-table-switch').on('change', function () {
    const checked = d3.event.target.checked
    renderOutputPable(outputData, DAYS_IN_MONTH, checked)
  })
}

// Функция конвертации данных из формата csv в json
function csvJSON (csv, divider = ';') {
  // Забираем все строки, кроме пустых
  const lines = csv.split('\n').filter(str => `${str} `.trim() !== '')

  const result = []

  const headers = lines[0].split(divider).map(d => d.trim())
  lines.splice(0, 1)
  lines.forEach(function (line) {
    const obj = {}
    const currentline = line.split(divider)
    headers.forEach(function (header, i) {
      obj[header] = currentline[i].trim()
    })
    result.push(obj)
  })

  return result // JavaScript object
  // return JSON.stringify(result); //JSON
}

const inputField = d3.select('#data-input')

d3.select('#data-form').on('submit', function () {
  d3.event.preventDefault()
  const inputData = inputField.property('value')
  convertData(csvJSON(inputData))
})
