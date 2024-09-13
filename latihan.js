// Variables
var nama = "Andre Edyson";
const npm = "22411002";
let age = 19;
let alamat = "Jambi";

nama = "Wendy Anjay Mabar";
alamat = "Citra Garden";
console.log(nama);
console.log(alamat);

// Object
const mahasiswa = {
  nama: "Andre Edyson",
  npm: "22411002",
  umur: 19,
  nilai: 85,
  isActive: true,
};

console.log(mahasiswa.nama);

// Function
function hitungNilai(a, b) {
  return a * b;
}

const hitungKeliling = (persegiPanjang) => {
  return 2 * (persegiPanjang.panjang + persegiPanjang.lebar);
};

// console.log(hitungNilai(2, 10));
// console.log(
//   hitungKeliling({
//     panjang: 20,
//     lebar: 41,
//   })
// );

// Array & Object Array
const months = ["Jan", "Feb", "Mar", "Apr", "May"];

const listMhs = [
  {
    nama: "Andre",
    npm: "22411002",
  },
  {
    nama: "Wendy",
    npm: "22411003",
  },
  {
    nama: "Dimas",
    npm: "22411009",
  },
];

// for (let i = 0; i < months.length; i++) {
//   console.log(months[i]);
// }

// let i = 0;
// while (i < listMhs.length) {
//   console.log(listMhs[i]);
//   i++;
// }

listMhs.forEach((mhs) => {
  console.log(mhs);
});
