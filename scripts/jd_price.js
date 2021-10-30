// [rule: raw jd.*/(\d+).html]
// [rule: raw jingxi.*sku=(\d+)]
// [rule: raw jd.*wareId=(\d+)]
// [rule: raw jd.*sku=(\d+)]
// [rule: raw jd.*/(\w+)]
// [rule:raw https://item\.m\.jd\.com/product/(\d+).html] 
// [rule:raw https://.+\.jd\.com/(\d+).html] 
// [rule:raw https://item\.m\.jd\.com/(\d+).html] 
// [rule:raw https://m\.jingxi\.com/item/jxview\?sku=(\d+)] 
// [rule:raw https://m\.jingxi\.com.+sku=(\d+)]
// [rule:raw https://kpl\.m\.jd\.com/product\?wareId=(\d+)]
// [rule:raw https://wq\.jd\.com/item/view\?sku=(\d+)]
// [rule:raw https://wqitem\.jd\.com.+sku=(\d+)]
// [rule:raw https://.+\.jd\.com.+sku=(\d+)]


var id = param(1)

var content = ""

var now = 123456;

if (!isNaN(id) && (parseInt(id).toString().length === id.length)) {
    content = "https://item.jd.com/" + id + ".html"
} else {
    content = "https://u.jd.com/" + id
}

var data = request({
    "url": "https://api.jingpinku.com/get_rebate_link/api?" +
        "appid=" + get("jingpinku_appid") +
        "&appkey=" + get("jingpinku_appkey") +
        "&union_id=" + get("jd_union_id") +
        "&content=" + content,
    "dataType": "json"
})
if (data && data.code == 0) {
    if (data.images.length > 0) {
        sendImage(data.images[0])
    }
    var finals = [];
    var lines = data.official.split("\n");
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("佣金") == -1) {
            finals.push(lines[i])
        }
    }
    sendText(finals.join("\n"))
} else {
    sendText("暂无商品信息。")
}
function time(time) {
    if (!time) {
        +new Date()
    }
    var date = new Date(time + 8 * 3600 * 1000);
    return date.toJSON().substr(0, 19).replace('T', ' ').split(' ')[0].replace(/\./g, '-');
}

function dayDiff(date) {
    return parseInt((new Date() - new Date(date)) / (1000 * 60 * 60 * 24) + '')
}

function priceDiff(old) {
    if (typeof old !== 'number')
        return '-'
    var diff = old - now;
    if (diff === 0)
        return '-'
    return diff > 0 ? "↓" + Math.round(diff) : "↑" + Math.round(Math.abs(diff));
}

function space(str, len) {
    var blank = "";
    for (var i = 0; i < len - (str + '').length; i++) {
        blank += " ";
    }
    return blank;
}


function main() {
    var sku = param(1)
    var url = "https://browser.bijiago.com/extension/price_towards?dp_ids=undefined&dp_id=" + sku + "-3&ver=1&format=jsonp&union=union_bijiago&version=1594190525099&from_device=bijiago&from_type=bjg_ser&crc64=1";
    var data = request({
        "url": url,
        "dataType": "json"
    })
    if (!data || !data.store) {
        sendText("暂无比价数据。")
        return
    }
    var Jun18 = 0,
        Nov11 = 0;
    var price30 = { price: 99999999, text: "" };
    var promo = data['promo'];
    var store = data['store'][1]
    var history = {
        max: Math.round(store['highest']),
        maxt: time(store['max_stamp'] * 1000),
        min: Math.round(store['lowest']),
        mint: time(parseInt(store['min_stamp']) * 1000)
    }

    for (var i = 0; i < promo.length; i++) {
        var stamp = promo[i]['time'] * 1000;
        var day = time(stamp).split(' ')[0];
        var price = Math.round(promo[i]['price'] / 100);
        day === '2021-06-18' ? Jun18 = price : ""
        day === '2020-11-11' ? Nov11 = price : ""
        if (dayDiff(day) < 31 && price <= price30.price) {
            price30.price = price;
            price30.text = day;
        }
    }
    if (history.min === 99999999) history.min = '-';
    if (Jun18 === 0) Jun18 = '-'
    if (Nov11 === 0) Nov11 = '-'
    var arr = []
        // arr.push({ name: '当前价', price: now, date: '', diff: '' })
    arr.push({ name: '最高价', price: history.max, date: history.maxt, diff: priceDiff(history.max) })
    arr.push({ name: '最低价', price: history.min, date: history.mint, diff: priceDiff(history.min) })
    arr.push({ name: '六一八', price: Jun18, date: "2021-06-18", diff: priceDiff(Jun18) })
    arr.push({ name: '双十一', price: Nov11, date: "2020-11-11", diff: priceDiff(Nov11) })
    arr.push({ name: '三十天', price: price30.price, date: price30.text, diff: priceDiff(price30.price) })
    var s = ''
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].price === '-' || arr[i].price === 0) {
            s += arr[i]["name"] + space('', 7) + "-" + "\n"
        } else {
            s += arr[i]["name"] + space('', 6) + arr[i]["price"] + space(arr[i]["price"], 8) + arr[i]["date"] + space(arr[i]["date"], 14) + "\n" //arr[i]["diff"] + 
        }
    }
    sendText(s.trim("\n"))
}

main()

