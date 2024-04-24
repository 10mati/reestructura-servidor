const socket = io();

  $(document).ready(function () {
    $('#product-form').submit(function (event) {
      event.preventDefault();

      const title = $('#title').val();
      const description = $('#description').val();
      const code = $('#code').val();
      const price = $('#price').val();
      const stock = $('#stock').val();
      const category = $('#category').val();

      const newProduct = {
        title: title,
        description: description,
        code: code,
        price: price,
        stock: stock,
        category: category
      };

      socket.emit('new-product', newProduct);
    });
  });

  socket.on('new-product-list', (productList) => {
    const productListEl = document.querySelector('#product-list');
    productListEl.innerHTML = '';

    
    const table = document.createElement('table');

    
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Title</th><th>Description</th><th>Code</th><th>Price</th><th>Stock</th><th>Category</th>';
    table.appendChild(headerRow);

   
    productList.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${product.title}</td><td>${product.description}</td><td>${product.code}</td><td>${product.price}</td><td>${product.stock}</td><td>${product.category}</td>`;
      table.appendChild(row);
    });

    
    productListEl.appendChild(table);

  });
  