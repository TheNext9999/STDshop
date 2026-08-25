// ================= TOPPING ĐỘNG =================

function addTopping() {

    const list = document.getElementById('toppingList')

    const div = document.createElement('div')

    div.className = 'topping-item'

    div.innerHTML = `
        <input type="text" placeholder="Thêm phân loại sản phẩm">
        <input type="number" placeholder="Giá phân loại mới" style="width:120px;">
        <button type="button" class="remove-topping" onclick="this.parentElement.remove()">Xóa</button>
    `

    list.appendChild(div)

}



// ================= PREVIEW ẢNH =================

document.getElementById('dishImage').addEventListener('change', function(e) {

    const file = e.target.files[0]

    if (file) {

        const reader = new FileReader()

        reader.onload = function(event) {

            document.getElementById('imagePreview').innerHTML =
            `<img src="${event.target.result}" alt="Preview">`

        }

        reader.readAsDataURL(file)

    }

})



// ================= LẤY TOPPING =================

function getToppings(){

const toppingElements = document.querySelectorAll(".topping-item")

let toppings = []

toppingElements.forEach(item=>{

const name = item.children[0].value
const price = item.children[1].value

if(name){

toppings.push({
name:name,
price:price
})

}

})

return toppings

}



// ================= LƯU MÓN CHỜ ADMIN DUYỆT =================

document.querySelector(".btn-primary").addEventListener("click",function(){

const name = document.querySelector('input[type="text"]').value

const price = document.querySelector('input[type="number"]').value

const category = document.querySelector("select").value

const desc = document.querySelector("textarea").value

const img = document.querySelector("#imagePreview img") ?
document.querySelector("#imagePreview img").src : ""

const toppings = getToppings()



if(!name || !price){

alert("❌ Vui lòng nhập tên món và giá")

return

}



let pendingFoods = JSON.parse(localStorage.getItem("pendingFoods")) || []



const newFood = {

id: Date.now(),

name:name,

price:price,

category:category,

desc:desc,

img:img,

toppings:toppings,

status:"pending",
date: new Date().toLocaleString()

}



pendingFoods.push(newFood)



localStorage.setItem("pendingFoods",JSON.stringify(pendingFoods))



alert("✅ Món đã gửi cho Admin để duyệt")



// reset form

document.querySelector("form").reset()

document.getElementById("imagePreview").innerHTML =
`<i class="fas fa-image" style="font-size:3rem; color:#ccc;"></i>`

document.getElementById("toppingList").innerHTML=""

})

