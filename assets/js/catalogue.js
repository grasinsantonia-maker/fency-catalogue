/**
 * Fency Premium Catalogue - SEXY Edition
 * Complete catalogue experience with carousels, categories, and premium interactions
 */

(function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const CONFIG = {
        dataPath: 'data/products.json',
        imagePath: 'assets/images/products/',
        heroInterval: 6000,
        categoryInterval: 5000,
        productCarouselInterval: 4000,
        videoFallbackInterval: 4000
    };

    // ========================================
    // State
    // ========================================
    let state = {
        products: [],
        currentFilter: 'all',
        heroCarousel: { currentIndex: 0, interval: null },
        categoryCarousels: {},
        productCarousels: {},
        videoFallback: { currentIndex: 0, interval: null },
        bestsellerCarousel: { currentIndex: 0 },
        lightbox: {
            isOpen: false,
            currentProduct: null,
            currentImageIndex: 0
        }
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        heroCarousel: document.getElementById('heroCarousel'),
        heroDots: document.getElementById('heroDots'),
        productsGrid: document.getElementById('productsGrid'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        lightbox: document.getElementById('lightbox'),
        lightboxImage: document.getElementById('lightboxImage'),
        lightboxTitle: document.getElementById('lightboxTitle'),
        lightboxCounter: document.getElementById('lightboxCounter'),
        lightboxThumbnails: document.getElementById('lightboxThumbnails'),
        lightboxClose: document.querySelector('.lightbox-close'),
        lightboxPrev: document.querySelector('.lightbox-prev'),
        lightboxNext: document.querySelector('.lightbox-next'),
        header: document.getElementById('header'),
        videoFallbackSlider: document.getElementById('videoFallbackSlider'),
        bestsellerImage: document.getElementById('bestsellerImage'),
        bestsellerGallery: document.getElementById('bestsellerGallery')
    };

    // ========================================
    // Initialize
    // ========================================
    async function init() {
        try {
            await loadProducts();
            renderHeroCarousel();
            renderVideoFallback();
            renderCategoryCarousels();
            renderBestseller();
            renderProducts();
            setupEventListeners();
            setupScrollEffects();
            startAllAutoplay();
        } catch (error) {
            console.error('Failed to initialize catalogue:', error);
            showError();
        }
    }

    // ========================================
    // Data Loading
    // ========================================
    async function loadProducts() {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error(`Failed to load products: ${response.status}`);
        }
        const data = await response.json();
        state.products = data.products;
    }

    // ========================================
    // Hero Carousel
    // ========================================
    function renderHeroCarousel() {
        // Get featured products (bestseller first, then others)
        const featured = [...state.products].sort((a, b) => b.bestseller - a.bestseller).slice(0, 5);

        elements.heroCarousel.innerHTML = featured.map((product, index) => `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img class="hero-slide-image"
                     src="${CONFIG.imagePath}${product.images[0]}"
                     alt="${product.nameHe}">
                <div class="hero-slide-overlay"></div>
                <div class="hero-slide-content hero-slide-content-centered">
                    <div class="hero-branding">
                        <img src="assets/images/brand/logo-fency-convert-white-01.png" alt="Fency" class="hero-logo">
                        <div class="hero-tagline">
                            <span class="hero-tagline-text">גדרות איכות</span>
                            <div class="hero-tagline-bars">
                                <span class="bar bar-orange"></span>
                                <span class="bar bar-gold"></span>
                                <span class="bar bar-gray"></span>
                            </div>
                        </div>
                    </div>
                    <h1 class="hero-slide-title hero-title-large">קטלוג הדגמים של FENCY</h1>
                    <p class="hero-slide-subtitle hero-subtitle-year">דגמי גדרות לשנת 2026</p>
                </div>
            </div>
        `).join('');

        // Render dots
        elements.heroDots.innerHTML = featured.map((_, index) => `
            <button class="hero-dot ${index === 0 ? 'active' : ''}"
                    data-index="${index}"
                    onclick="window.catalogue.goToHeroSlide(${index})"></button>
        `).join('');
    }

    function goToHeroSlide(index) {
        const slides = elements.heroCarousel.querySelectorAll('.hero-slide');
        const dots = elements.heroDots.querySelectorAll('.hero-dot');

        state.heroCarousel.currentIndex = index;

        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function nextHeroSlide() {
        const slides = elements.heroCarousel.querySelectorAll('.hero-slide');
        const nextIndex = (state.heroCarousel.currentIndex + 1) % slides.length;
        goToHeroSlide(nextIndex);
    }

    function prevHeroSlide() {
        const slides = elements.heroCarousel.querySelectorAll('.hero-slide');
        const prevIndex = (state.heroCarousel.currentIndex - 1 + slides.length) % slides.length;
        goToHeroSlide(prevIndex);
    }

    // ========================================
    // Video Fallback (Ken Burns slideshow)
    // ========================================
    function renderVideoFallback() {
        // Use various product images for the video fallback
        const images = state.products.flatMap(p => p.images.slice(0, 2)).slice(0, 6);

        elements.videoFallbackSlider.innerHTML = images.map((img, index) => `
            <div class="video-fallback-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${CONFIG.imagePath}${img}" alt="Fency">
            </div>
        `).join('');

        // Start autoplay
        state.videoFallback.interval = setInterval(() => {
            const slides = elements.videoFallbackSlider.querySelectorAll('.video-fallback-slide');
            const nextIndex = (state.videoFallback.currentIndex + 1) % slides.length;

            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === nextIndex);
            });

            state.videoFallback.currentIndex = nextIndex;
        }, CONFIG.videoFallbackInterval);
    }

    // ========================================
    // Category Carousels
    // ========================================
    function renderCategoryCarousels() {
        const categories = {
            'privacy': { slidesEl: document.getElementById('privacySlides') },
            'semi-privacy': { slidesEl: document.getElementById('semiPrivacySlides') },
            'decorative': { slidesEl: document.getElementById('decorativeSlides') },
            'modern': { slidesEl: document.getElementById('modernSlides') }
        };

        Object.entries(categories).forEach(([category, { slidesEl }]) => {
            if (!slidesEl) return;

            const categoryProducts = state.products.filter(p => p.categories.includes(category));
            const images = categoryProducts.flatMap(p => p.images.slice(0, 3));

            slidesEl.innerHTML = images.map((img, index) => `
                <div class="category-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${CONFIG.imagePath}${img}" alt="${category}">
                </div>
            `).join('');

            // Initialize state
            state.categoryCarousels[category] = {
                currentIndex: 0,
                totalSlides: images.length,
                interval: null
            };

            // Start autoplay
            state.categoryCarousels[category].interval = setInterval(() => {
                nextCategorySlide(category);
            }, CONFIG.categoryInterval);
        });
    }

    function goToCategorySlide(category, index) {
        const slidesEl = document.getElementById(`${category.replace('-', '')}Slides`) ||
                         document.querySelector(`[data-category="${category}"] .category-slides`);
        if (!slidesEl) return;

        const slides = slidesEl.querySelectorAll('.category-slide');
        state.categoryCarousels[category].currentIndex = index;

        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
    }

    function nextCategorySlide(category) {
        const carousel = state.categoryCarousels[category];
        if (!carousel) return;
        const nextIndex = (carousel.currentIndex + 1) % carousel.totalSlides;
        goToCategorySlide(category, nextIndex);
    }

    function prevCategorySlide(category) {
        const carousel = state.categoryCarousels[category];
        if (!carousel) return;
        const prevIndex = (carousel.currentIndex - 1 + carousel.totalSlides) % carousel.totalSlides;
        goToCategorySlide(category, prevIndex);
    }

    // ========================================
    // Bestseller Section
    // ========================================
    function renderBestseller() {
        const bestseller = state.products.find(p => p.bestseller) || state.products[0];
        if (!bestseller) return;

        // Set background image
        elements.bestsellerImage.style.backgroundImage = `url(${CONFIG.imagePath}${bestseller.images[0]})`;

        // Render thumbnail gallery
        elements.bestsellerGallery.innerHTML = bestseller.images.slice(0, 5).map((img, index) => `
            <button class="bestseller-thumb ${index === 0 ? 'active' : ''}"
                    data-index="${index}"
                    onclick="window.catalogue.changeBestsellerImage(${index})">
                <img src="${CONFIG.imagePath}${img}" alt="${bestseller.nameHe}">
            </button>
        `).join('');
    }

    function changeBestsellerImage(index) {
        const bestseller = state.products.find(p => p.bestseller) || state.products[0];
        if (!bestseller) return;

        state.bestsellerCarousel.currentIndex = index;
        elements.bestsellerImage.style.backgroundImage = `url(${CONFIG.imagePath}${bestseller.images[index]})`;

        const thumbs = elements.bestsellerGallery.querySelectorAll('.bestseller-thumb');
        thumbs.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    // ========================================
    // Products Grid
    // ========================================
    function renderProducts() {
        const filteredProducts = filterProducts(state.products, state.currentFilter);

        if (filteredProducts.length === 0) {
            elements.productsGrid.innerHTML = `
                <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                    <h3>לא נמצאו מוצרים</h3>
                    <p>נסה לבחור קטגוריה אחרת</p>
                </div>
            `;
            return;
        }

        elements.productsGrid.innerHTML = filteredProducts.map((product, index) =>
            createProductCard(product, index)
        ).join('');

        // Initialize product carousels
        filteredProducts.forEach(product => {
            if (product.images.length > 1) {
                initProductCarousel(product.id, product.images.length);
            }
        });
    }

    function createProductCard(product, index) {
        const imageCount = product.images.length;
        const badgeHtml = product.bestseller ? '<span class="product-badge">הנמכר ביותר</span>' : '';

        const dotsHtml = imageCount > 1 ? `
            <div class="product-carousel-dots">
                ${product.images.map((_, i) => `
                    <button class="product-dot ${i === 0 ? 'active' : ''}"
                            data-index="${i}"></button>
                `).join('')}
            </div>
        ` : '';

        const navHtml = imageCount > 1 ? `
            <button class="product-carousel-nav product-carousel-prev" data-product="${product.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
            <button class="product-carousel-nav product-carousel-next" data-product="${product.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
        ` : '';

        return `
            <article class="product-card" data-product-id="${product.id}" style="animation-delay: ${index * 0.05}s">
                <div class="product-image-wrapper">
                    ${badgeHtml}
                    <div class="product-carousel" data-carousel="${product.id}">
                        <div class="product-carousel-track">
                            ${product.images.map((img, i) => `
                                <div class="product-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                                    <img src="${CONFIG.imagePath}${img}"
                                         alt="${product.nameHe} - תמונה ${i + 1}"
                                         loading="${i === 0 ? 'eager' : 'lazy'}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ${navHtml}
                    ${dotsHtml}
                    <span class="product-image-count">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        ${imageCount}
                    </span>
                    <div class="product-overlay">
                        <button class="product-view-btn" onclick="window.catalogue.openLightbox('${product.id}', 0)">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                            </svg>
                            פתח גלריה
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h2 class="product-title">${product.nameHe}</h2>
                    <p class="product-description">${product.description}</p>
                    <div class="product-tags">
                        ${product.features.slice(0, 3).map(f => `<span class="product-tag">${f}</span>`).join('')}
                    </div>
                </div>
            </article>
        `;
    }

    function filterProducts(products, category) {
        if (category === 'all') return products;
        return products.filter(p => p.categories.includes(category));
    }

    // ========================================
    // Product Carousels
    // ========================================
    function initProductCarousel(productId, imageCount) {
        state.productCarousels[productId] = {
            currentIndex: 0,
            imageCount: imageCount,
            interval: null,
            isPaused: false
        };

        startProductCarouselAutoplay(productId);
    }

    function startProductCarouselAutoplay(productId) {
        const carousel = state.productCarousels[productId];
        if (!carousel) return;

        carousel.interval = setInterval(() => {
            if (!carousel.isPaused) {
                nextProductSlide(productId);
            }
        }, CONFIG.productCarouselInterval);
    }

    function goToProductSlide(productId, index) {
        const carousel = state.productCarousels[productId];
        if (!carousel) return;

        carousel.currentIndex = index;

        const carouselEl = document.querySelector(`[data-carousel="${productId}"]`);
        if (!carouselEl) return;

        const slides = carouselEl.querySelectorAll('.product-slide');
        const dots = carouselEl.parentElement.querySelectorAll('.product-dot');

        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function nextProductSlide(productId) {
        const carousel = state.productCarousels[productId];
        if (!carousel) return;
        const nextIndex = (carousel.currentIndex + 1) % carousel.imageCount;
        goToProductSlide(productId, nextIndex);
    }

    function prevProductSlide(productId) {
        const carousel = state.productCarousels[productId];
        if (!carousel) return;
        const prevIndex = (carousel.currentIndex - 1 + carousel.imageCount) % carousel.imageCount;
        goToProductSlide(productId, prevIndex);
    }

    // ========================================
    // Event Listeners
    // ========================================
    function setupEventListeners() {
        // Filter buttons
        elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', handleFilterClick);
        });

        // Category filter links
        document.querySelectorAll('.category-cta[data-filter]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = link.dataset.filter;
                setFilter(filter);
                document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Hero carousel navigation
        document.querySelector('.hero-prev')?.addEventListener('click', prevHeroSlide);
        document.querySelector('.hero-next')?.addEventListener('click', nextHeroSlide);

        // Category carousel navigation
        document.querySelectorAll('.cat-nav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = btn.dataset.category;
                if (btn.classList.contains('cat-prev')) {
                    prevCategorySlide(category);
                } else {
                    nextCategorySlide(category);
                }
            });
        });

        // Product carousel navigation (delegated)
        document.addEventListener('click', handleProductCarouselClick);

        // Pause product carousels on hover
        document.addEventListener('mouseenter', handleProductCardHover, true);
        document.addEventListener('mouseleave', handleProductCardLeave, true);

        // Lightbox
        elements.lightboxClose?.addEventListener('click', closeLightbox);
        elements.lightboxPrev?.addEventListener('click', showPrevImage);
        elements.lightboxNext?.addEventListener('click', showNextImage);
        elements.lightbox?.addEventListener('click', handleLightboxBackdropClick);

        // Keyboard
        document.addEventListener('keydown', handleKeydown);

        // Touch swipe
        setupTouchSwipe();
    }

    function handleFilterClick(e) {
        const filter = e.currentTarget.dataset.filter;
        setFilter(filter);
    }

    function setFilter(filter) {
        // Update buttons
        elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Clear product carousels
        Object.keys(state.productCarousels).forEach(id => {
            clearInterval(state.productCarousels[id].interval);
        });
        state.productCarousels = {};

        // Update state and re-render
        state.currentFilter = filter;

        elements.productsGrid.style.opacity = '0';
        setTimeout(() => {
            renderProducts();
            elements.productsGrid.style.opacity = '1';
        }, 200);
    }

    function handleProductCarouselClick(e) {
        const prevBtn = e.target.closest('.product-carousel-prev');
        const nextBtn = e.target.closest('.product-carousel-next');
        const dot = e.target.closest('.product-dot');

        if (prevBtn) {
            e.stopPropagation();
            prevProductSlide(prevBtn.dataset.product);
        } else if (nextBtn) {
            e.stopPropagation();
            nextProductSlide(nextBtn.dataset.product);
        } else if (dot) {
            e.stopPropagation();
            const card = dot.closest('.product-card');
            const productId = card.dataset.productId;
            const index = parseInt(dot.dataset.index);
            goToProductSlide(productId, index);
        }
    }

    function handleProductCardHover(e) {
        const card = e.target.closest('.product-card');
        if (card) {
            const productId = card.dataset.productId;
            if (state.productCarousels[productId]) {
                state.productCarousels[productId].isPaused = true;
            }
        }
    }

    function handleProductCardLeave(e) {
        const card = e.target.closest('.product-card');
        if (card) {
            const productId = card.dataset.productId;
            if (state.productCarousels[productId]) {
                state.productCarousels[productId].isPaused = false;
            }
        }
    }

    function handleKeydown(e) {
        if (!state.lightbox.isOpen) return;

        switch (e.key) {
            case 'Escape': closeLightbox(); break;
            case 'ArrowRight': showPrevImage(); break;
            case 'ArrowLeft': showNextImage(); break;
        }
    }

    function handleLightboxBackdropClick(e) {
        if (e.target === elements.lightbox) {
            closeLightbox();
        }
    }

    function setupTouchSwipe() {
        const SWIPE_THRESHOLD = 50;

        // Helper function to add swipe to an element
        function addSwipeHandler(element, onSwipeLeft, onSwipeRight) {
            if (!element) return;

            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            element.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            element.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;

                const diffX = touchStartX - touchEndX;
                const diffY = touchStartY - touchEndY;

                // Only trigger horizontal swipe if it's more horizontal than vertical
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
                    if (diffX > 0) {
                        onSwipeLeft();
                    } else {
                        onSwipeRight();
                    }
                }
            }, { passive: true });
        }

        // Hero carousel swipe
        addSwipeHandler(
            elements.heroCarousel,
            () => goToHeroSlide((state.heroCarousel.currentIndex + 1) % getHeroSlideCount()),
            () => goToHeroSlide((state.heroCarousel.currentIndex - 1 + getHeroSlideCount()) % getHeroSlideCount())
        );

        // Lightbox swipe
        addSwipeHandler(
            document.querySelector('.lightbox-main'),
            () => showNextImage(),
            () => showPrevImage()
        );

        // Category carousel swipes
        document.querySelectorAll('.category-visual').forEach(visual => {
            const categoryId = visual.closest('.category-section')?.id;
            if (categoryId && state.categoryCarousels[categoryId]) {
                addSwipeHandler(
                    visual,
                    () => {
                        const carousel = state.categoryCarousels[categoryId];
                        const slides = document.querySelectorAll(`#${categoryId} .category-slide`);
                        carousel.currentIndex = (carousel.currentIndex + 1) % slides.length;
                        updateCategorySlide(categoryId);
                    },
                    () => {
                        const carousel = state.categoryCarousels[categoryId];
                        const slides = document.querySelectorAll(`#${categoryId} .category-slide`);
                        carousel.currentIndex = (carousel.currentIndex - 1 + slides.length) % slides.length;
                        updateCategorySlide(categoryId);
                    }
                );
            }
        });

        // Product carousel swipes (delegated for dynamically added cards)
        elements.productsGrid?.addEventListener('touchstart', handleProductTouchStart, { passive: true });
        elements.productsGrid?.addEventListener('touchend', handleProductTouchEnd, { passive: true });
    }

    let productTouchStartX = 0;
    let productTouchStartY = 0;

    function handleProductTouchStart(e) {
        productTouchStartX = e.changedTouches[0].screenX;
        productTouchStartY = e.changedTouches[0].screenY;
    }

    function handleProductTouchEnd(e) {
        const wrapper = e.target.closest('.product-image-wrapper');
        if (!wrapper) return;

        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = productTouchStartX - touchEndX;
        const diffY = productTouchStartY - touchEndY;

        // Only trigger horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            const card = wrapper.closest('.product-card');
            const productId = card?.dataset.productId;
            if (productId) {
                if (diffX > 0) {
                    nextProductSlide(productId);
                } else {
                    prevProductSlide(productId);
                }
            }
        }
    }

    function getHeroSlideCount() {
        return document.querySelectorAll('.hero-slide').length;
    }

    function updateCategorySlide(categoryId) {
        const slides = document.querySelectorAll(`#${categoryId} .category-slide`);
        const currentIndex = state.categoryCarousels[categoryId].currentIndex;
        slides.forEach((slide, i) => slide.classList.toggle('active', i === currentIndex));
    }

    // ========================================
    // Lightbox
    // ========================================
    function openLightbox(productId, imageIndex = 0) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        state.lightbox.isOpen = true;
        state.lightbox.currentProduct = product;
        state.lightbox.currentImageIndex = imageIndex;

        // Render thumbnails
        elements.lightboxThumbnails.innerHTML = product.images.map((img, i) => `
            <button class="lightbox-thumb ${i === imageIndex ? 'active' : ''}"
                    onclick="window.catalogue.goToLightboxImage(${i})">
                <img src="${CONFIG.imagePath}${img}" alt="תמונה ${i + 1}">
            </button>
        `).join('');

        updateLightboxImage();
        elements.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        state.lightbox.isOpen = false;
        state.lightbox.currentProduct = null;
        state.lightbox.currentImageIndex = 0;

        elements.lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showPrevImage() {
        if (!state.lightbox.currentProduct) return;
        const total = state.lightbox.currentProduct.images.length;
        state.lightbox.currentImageIndex = (state.lightbox.currentImageIndex - 1 + total) % total;
        updateLightboxImage();
        updateLightboxThumbnails();
    }

    function showNextImage() {
        if (!state.lightbox.currentProduct) return;
        const total = state.lightbox.currentProduct.images.length;
        state.lightbox.currentImageIndex = (state.lightbox.currentImageIndex + 1) % total;
        updateLightboxImage();
        updateLightboxThumbnails();
    }

    function goToLightboxImage(index) {
        if (!state.lightbox.currentProduct) return;
        state.lightbox.currentImageIndex = index;
        updateLightboxImage();
        updateLightboxThumbnails();
    }

    function updateLightboxImage() {
        const product = state.lightbox.currentProduct;
        const index = state.lightbox.currentImageIndex;
        const imagePath = CONFIG.imagePath + product.images[index];

        elements.lightboxImage.style.opacity = '0';
        elements.lightboxImage.style.transform = 'scale(0.95)';

        setTimeout(() => {
            elements.lightboxImage.src = imagePath;
            elements.lightboxImage.alt = `${product.nameHe} - תמונה ${index + 1}`;
            elements.lightboxTitle.textContent = product.nameHe;
            elements.lightboxCounter.textContent = `תמונה ${index + 1} מתוך ${product.images.length}`;

            elements.lightboxImage.onload = () => {
                elements.lightboxImage.style.opacity = '1';
                elements.lightboxImage.style.transform = 'scale(1)';
            };
        }, 150);
    }

    function updateLightboxThumbnails() {
        const index = state.lightbox.currentImageIndex;
        const thumbs = elements.lightboxThumbnails.querySelectorAll('.lightbox-thumb');

        thumbs.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // Scroll active thumb into view
        const activeThumb = thumbs[index];
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    // ========================================
    // Scroll Effects
    // ========================================
    function setupScrollEffects() {
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Header effect
            if (elements.header) {
                elements.header.classList.toggle('scrolled', currentScroll > 50);
            }

            lastScroll = currentScroll;
        }, { passive: true });

        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in, .category-section, .fs-item').forEach(el => {
            observer.observe(el);
        });
    }

    // ========================================
    // Autoplay Management
    // ========================================
    function startAllAutoplay() {
        // Hero carousel
        state.heroCarousel.interval = setInterval(nextHeroSlide, CONFIG.heroInterval);

        // Pause hero on hover
        elements.heroCarousel?.addEventListener('mouseenter', () => {
            clearInterval(state.heroCarousel.interval);
        });

        elements.heroCarousel?.addEventListener('mouseleave', () => {
            state.heroCarousel.interval = setInterval(nextHeroSlide, CONFIG.heroInterval);
        });
    }

    // ========================================
    // Error Handling
    // ========================================
    function showError() {
        elements.productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <h3>שגיאה בטעינת המוצרים</h3>
                <p>אנא רענן את הדף ונסה שוב</p>
            </div>
        `;
    }

    // ========================================
    // Public API
    // ========================================
    window.catalogue = {
        openLightbox,
        closeLightbox,
        goToLightboxImage,
        goToHeroSlide,
        changeBestsellerImage
    };

    // ========================================
    // Start Application
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
