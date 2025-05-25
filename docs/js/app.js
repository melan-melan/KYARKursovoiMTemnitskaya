let items = [], cart = []; // Initialize arrays for products and cart

// 1) Load all products from XML
async function loadItems() {
    try {
        const res = await fetch('products.xml');
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, 'application/xml');
        items = Array.from(doc.querySelectorAll('item')).map(item => ({
            name: item.querySelector('name').textContent,
            type: item.querySelector('type').textContent,
            price: parseFloat(item.querySelector('price').textContent),
            images: Array.from(item.querySelectorAll('image')).map(img => img.textContent),
            description: item.querySelector('description').textContent,
            sizes: Array.from(item.querySelectorAll('size')).map(size => size.textContent),
            colors: Array.from(item.querySelectorAll('color')).map(color => color.textContent)
        }));
        cart = loadCart(); // Load cart when products are loaded
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Load cart from localStorage
function loadCart() {
    const storedCart = localStorage.getItem('cart');
    return storedCart ? storedCart.split(';').map(item => {
        const [name, type, size, color, price] = item.split(',');
        return { name, type, size, color, price: parseFloat(price) };
    }) : [];
}

// 2) Render catalog items
function renderCatalog(list) {
    const container = document.getElementById('catalog');
    if (container) {
        container.innerHTML = ''; // Clear container before rendering
        const fragment = document.createDocumentFragment(); // Use a document fragment for performance
        list.forEach(({ images, name, price }) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="image" style="background-image:url(${images[0]})"></div>
                <div class="info">
                    <h3>${name}</h3>
                    <p class="price">${price.toFixed(2)} BYN</p>
                    <button data-name="${name}">Подробнее</button>
                </div>`;
            fragment.appendChild(card);
        });
        container.appendChild(fragment); // Append all cards at once
    }
}

// 3) Apply filters and sorting
function applyFilters() {
    let filtered = [...items];
    const category = document.getElementById('filter-cat')?.value; // Изменено на category
    const sort = document.getElementById('filter-sort')?.value;

    // Фильтрация по категории
    if (category && category !== 'all') {
        filtered = filtered.filter(item => item.type.toLowerCase() === category.toLowerCase()); // Убедитесь в соответствии регистров
    }

    // Сортировка
    if (sort === 'asc' || sort === 'desc') {
        filtered.sort((a, b) => sort === 'asc' ? a.price - b.price : b.price - a.price);
    }

    renderCatalog(filtered); // Обновление отображения
}

// 4) Show product details
function openDetails(name) {
    const item = items.find(i => i.name === name);
    if (!item) return;

    const { type, description, price, sizes, colors, images } = item;
    document.getElementById('d-name').textContent = item.name;
    document.getElementById('d-type').textContent = type;
    document.getElementById('d-desc').textContent = description;
    document.getElementById('d-price').textContent = price.toFixed(2) + ' BYN';

    document.getElementById('d-sizes').innerHTML = sizes.map(size => `<option>${size}</option>`).join('');
    document.getElementById('d-colors').innerHTML = colors.map(color => `<option>${color}</option>`).join('');

    setupImageModal(images);
    document.getElementById('product-modal').classList.add('active');
}

// Set up images in modal
function setupImageModal(images) {
    const modalImage = document.getElementById('modal-image');
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    let currentIndex = 0;

    function updateImage() {
        modalImage.src = images[currentIndex];
    }

    prevButton.onclick = () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
        updateImage();
    };

    nextButton.onclick = () => {
        currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
        updateImage();
    };

    updateImage(); // Initial image setup
}

// 5) Add to cart
function addToCart() {
    const name = document.getElementById('d-name').textContent;
    const size = document.getElementById('d-sizes').value;
    const color = document.getElementById('d-colors').value;
    const price = parseFloat(document.getElementById('d-price').textContent);
    const type = document.getElementById('d-type').textContent;

    cart.push({ name, type, size, color, price });
    saveCart(); // Save cart to localStorage
    updateCartCount();
    document.getElementById('product-modal').classList.remove('active');
}

// Save cart to localStorage
function saveCart() {
    const serializedCart = cart.map(item => `${item.name},${item.type},${item.size},${item.color},${item.price}`).join(';');
    localStorage.setItem('cart', serializedCart);
}

// 6) Show cart
function showCart() {
    const modal = document.getElementById('cart-modal');
    const list = modal.querySelector('#cart-list');
    let sum = 0;
    list.innerHTML = '';

    cart.forEach((it, idx) => {
        sum += it.price;
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            ${it.name} | ${it.type} | ${it.size}/${it.color} — ${it.price.toFixed(2)} BYN
            <button data-idx="${idx}">×</button>
        `;
        list.appendChild(li);
    });

    list.querySelectorAll('button').forEach(b => {
        b.onclick = () => {
            cart.splice(+b.dataset.idx, 1);
            saveCart(); // Save cart after modification
            showCart();
            updateCartCount();
        };
    });

    modal.querySelector('#cart-total').textContent = `Итого: ${sum.toFixed(2)} BYN`;
    modal.classList.add('active');
}

// 7) Checkout
function checkout() {
    alert('Ваш заказ успешно оформлен!');
    cart = [];
    localStorage.removeItem('cart'); // Clear cart from localStorage after checkout
    updateCartCount();
    document.getElementById('cart-modal').classList.remove('active');
}

// 8) Update cart count
function updateCartCount() {
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.textContent = `КОРЗИНА(${cart.length})`;
    }
}

// 9) Initialize cart
function initCart() {
    updateCartCount();

    const cartButton = document.getElementById('cart-button');
    if (cartButton) cartButton.onclick = showCart;

    const closeCart = document.getElementById('close-cart');
    if (closeCart) closeCart.onclick = () => 
        document.getElementById('cart-modal').classList.remove('active');

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) checkoutButton.onclick = checkout;
}

// 10) Initialize catalog
function initCatalog() {
    if (document.getElementById('catalog')) {
        renderCatalog(items);
        document.getElementById('catalog').onclick = e => {
            if (e.target.tagName === 'BUTTON') {
                openDetails(e.target.dataset.name);
            }
        };

        const btn = document.getElementById('apply-filters');
        if (btn) btn.onclick = applyFilters;
    }
}

// 11) Initialize product modal
function initProductModal() {
    const addCart = document.getElementById('add-cart');
    if (addCart) addCart.onclick = addToCart;

    const closeDetails = document.getElementById('close-details');
    if (closeDetails) closeDetails.onclick = () =>
        document.getElementById('product-modal').classList.remove('active');
}

// 12) Render popular items
function renderPopularItems() {
    const popularContainer = document.getElementById('popular-carousel');
    if (!popularContainer) return;

    const popularItems = [...items]
        .sort((a, b) => a.price - b.price)
        .slice(0, 10);

    popularContainer.innerHTML = '';
    popularItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="image" style="background-image:url(${item.images[0]})"></div>
            <div class="info">
                <h3>${item.name}</h3>
                <p class="price">${item.price.toFixed(2)} BYN</p>
                <button data-name="${item.name}">Подробнее</button>
            </div>
        `;
        popularContainer.appendChild(card);
    });

    popularContainer.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => openDetails(btn.dataset.name);
    });
}

// Main initialization
window.addEventListener('DOMContentLoaded', async () => {
    await loadItems();

    initCart();
    initCatalog();
    initProductModal();
    renderPopularItems();
});