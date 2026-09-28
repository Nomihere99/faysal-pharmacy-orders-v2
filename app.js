const STORAGE_KEY = "faysalOrdersV2";

let database = JSON.parse(
    localStorage.getItem(STORAGE_KEY) ||
    '{"demands":[],"orders":[]}'
);

let selectedDemands = new Set();
let currentOrderItems = [];


// ===============================
// BASIC HELPERS
// ===============================

function getElement(id) {
    return document.getElementById(id);
}


function saveDatabase() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(database)
    );
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {

        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}


function statusBadge(status) {

    return `
        <span class="badge ${status}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    `;
}


function emptyMessage(text) {

    return `
        <div class="info-card">
            <p>${text}</p>
        </div>
    `;
}


// ===============================
// RENDER APPLICATION
// ===============================

function renderApp() {

    const pending =
        database.demands.filter(
            item => item.status === "pending"
        ).length;

    const ordered =
        database.demands.filter(
            item => item.status === "ordered"
        ).length;

    const received =
        database.demands.filter(
            item => item.status === "received"
        ).length;


    const pendingStat =
        getElement("pendingStat");

    const orderedStat =
        getElement("orderedStat");

    const receivedStat =
        getElement("receivedStat");


    if (pendingStat) {
        pendingStat.textContent = pending;
    }

    if (orderedStat) {
        orderedStat.textContent = ordered;
    }

    if (receivedStat) {
        receivedStat.textContent = received;
    }


    renderDemands();

    renderHome();

    renderOrders();

    updateSelectedCount();
}


// ===============================
// HOME
// ===============================

function renderHome() {

    const homeList =
        getElement("homeList");

    if (!homeList) {
        return;
    }


    const recent =
        database.demands
            .slice()
            .reverse()
            .slice(0, 5);


    if (recent.length === 0) {

        homeList.innerHTML =
            emptyMessage(
                "No recent demands."
            );

        return;
    }


    homeList.innerHTML =
        recent.map(function (item) {

            return `
                <div class="card">

                    <div class="card-main">

                        <b>
                            ${escapeHTML(item.medicine)}
                        </b>

                        <small>
                            Qty: ${item.quantity}
                            · By:
                            ${escapeHTML(
                                item.employee || "Unknown"
                            )}

                            <br>

                            ${new Date(
                                item.createdAt
                            ).toLocaleString()}
                        </small>

                    </div>

                    ${statusBadge(item.status)}

                </div>
            `;

        }).join("");
}


// ===============================
// DEMANDS
// ===============================

function renderDemands() {

    const demandList =
        getElement("demandList");

    if (!demandList) {
        return;
    }


    if (database.demands.length === 0) {

        demandList.innerHTML =
            emptyMessage(
                "No demands yet. Add your first demand."
            );

        return;
    }


    demandList.innerHTML =
        database.demands.map(function (item) {

            const checkbox =
                item.status === "pending"
                    ? `
                        <input
                            class="check demand-check"
                            type="checkbox"
                            data-id="${item.id}"
                            ${
                                selectedDemands.has(item.id)
                                    ? "checked"
                                    : ""
                            }
                        >
                    `
                    : "";


            return `
                <div class="card">

                    ${checkbox}

                    <div class="card-main">

                        <b>
                            ${escapeHTML(item.medicine)}
                        </b>

                        <small>

                            Qty: ${item.quantity}

                            · By:
                            ${escapeHTML(
                                item.employee || "Unknown"
                            )}

                            ${
                                item.note
                                    ? " · " +
                                      escapeHTML(item.note)
                                    : ""
                            }

                            <br>

                            ${new Date(
                                item.createdAt
                            ).toLocaleString()}

                        </small>

                    </div>

                    ${statusBadge(item.status)}

                </div>
            `;

        }).join("");


    document
        .querySelectorAll(".demand-check")
        .forEach(function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    const id =
                        Number(
                            checkbox.dataset.id
                        );


                    if (checkbox.checked) {

                        selectedDemands.add(id);

                    } else {

                        selectedDemands.delete(id);

                    }


                    updateSelectedCount();

                }
            );

        });
}


// ===============================
// ORDERS
// ===============================

function renderOrders() {

    const orderList =
        getElement("orderList");

    if (!orderList) {
        return;
    }


    if (database.orders.length === 0) {

        orderList.innerHTML =
            emptyMessage(
                "No orders yet."
            );

        return;
    }


    orderList.innerHTML =
        database.orders
            .slice()
            .reverse()
            .map(function (order) {

                const received =
                    order.status === "received";


                return `
                    <div class="card">

                        <div class="card-main">

                            <b>
                                ${
                                    escapeHTML(
                                        order.distributor ||
                                        "Unassigned"
                                    )
                                }
                            </b>

                            <small>

                                ${order.items.length}
                                item(s)

                                ·

                                ${new Date(
                                    order.createdAt
                                ).toLocaleString()}

                            </small>

                        </div>


                        ${
                            received

                            ? statusBadge("received")

                            : `
                                <button
                                    class="small-btn receive-order"
                                    data-id="${order.id}"
                                >
                                    Mark Received
                                </button>
                            `
                        }

                    </div>
                `;

            })
            .join("");


    document
        .querySelectorAll(".receive-order")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const orderId =
                        Number(
                            button.dataset.id
                        );

                    markOrderReceived(orderId);

                }
            );

        });
}


// ===============================
// NAVIGATION
// ===============================

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(function (page) {

            page.classList.toggle(
                "active",
                page.id === pageName
            );

        });


    document
        .querySelectorAll(".nav")
        .forEach(function (navigation) {

            navigation.classList.toggle(
                "active",
                navigation.dataset.page === pageName
            );

        });


    renderApp();
}


// ===============================
// SELECTED DEMANDS
// ===============================

function updateSelectedCount() {

    const counter =
        getElement("selectedCount");

    if (counter) {

        counter.textContent =
            selectedDemands.size;

    }
}


// ===============================
// ADD DEMAND MODAL
// ===============================

function openDemandModal() {

    const modal =
        getElement("demandModal");

    if (!modal) {
        return;
    }


    modal.classList.add("open");


    const employee =
        getElement("employee");

    if (employee) {

        employee.focus();

    }
}


function closeDemandModal() {

    const modal =
        getElement("demandModal");

    if (modal) {

        modal.classList.remove("open");

    }
}


// ===============================
// QUANTITY BUTTONS
// ===============================

function increaseQuantity() {

    const quantity =
        getElement("quantity");

    if (!quantity) {
        return;
    }


    const current =
        Number(quantity.value) || 1;


    quantity.value =
        current + 1;
}


function decreaseQuantity() {

    const quantity =
        getElement("quantity");

    if (!quantity) {
        return;
    }


    const current =
        Number(quantity.value) || 1;


    quantity.value =
        Math.max(1, current - 1);
}


// ===============================
// SAVE DEMAND
// ===============================

function saveDemand(event) {

    event.preventDefault();


    const employee =
        getElement("employee").value.trim();

    const medicine =
        getElement("medicine").value.trim();

    const quantity =
        Number(
            getElement("quantity").value
        );

    const note =
        getElement("note").value.trim();


    if (!employee) {

        alert(
            "Please enter employee name."
        );

        return;
    }


    if (!medicine) {

        alert(
            "Please enter medicine or product name."
        );

        return;
    }


    if (!quantity || quantity < 1) {

        alert(
            "Quantity must be at least 1."
        );

        return;
    }


    const demand = {

        id: Date.now(),

        employee: employee,

        medicine: medicine,

        quantity: quantity,

        note: note,

        status: "pending",

        createdAt:
            new Date().toISOString()

    };


    database.demands.push(demand);


    saveDatabase();


    event.target.reset();


    getElement("quantity").value = 1;


    closeDemandModal();


    renderApp();
}


// ===============================
// ORDER MESSAGE
// ===============================

function createOrderMessage(
    items,
    distributor
) {

    let message =
        "FAYSAL PHARMACY\n" +
        "PURCHASE ORDER\n";


    if (distributor) {

        message +=
            "Distributor: " +
            distributor +
            "\n";

    }


    message +=
        "Date: " +
        new Date().toLocaleDateString() +
        "\n\n";


    items.forEach(function (item, index) {

        message +=
            (index + 1) +
            ". " +
            item.medicine +
            " — Qty: " +
            item.quantity;


        if (item.note) {

            message +=
                " — " +
                item.note;

        }


        message += "\n";

    });


    message +=
        "\nTotal items: " +
        items.length;


    return message;
}


// ===============================
// OPEN ORDER MODAL
// ===============================

function openOrderModal() {

    if (selectedDemands.size === 0) {

        alert(
            "Select at least one pending demand."
        );

        return;
    }


    currentOrderItems =
        database.demands.filter(
            function (item) {

                return selectedDemands.has(
                    item.id
                );

            }
        );


    const distributor =
        getElement("distributor");


    distributor.value = "";


    getElement("orderPreview").textContent =
        createOrderMessage(
            currentOrderItems,
            ""
        );


    getElement("orderModal")
        .classList.add("open");
}


// ===============================
// CLOSE ORDER MODAL
// ===============================

function closeOrderModal() {

    getElement("orderModal")
        .classList.remove("open");
}


// ===============================
// UPDATE ORDER PREVIEW
// ===============================

function updateOrderPreview() {

    const distributor =
        getElement("distributor")
            .value
            .trim();


    getElement("orderPreview")
        .textContent =
        createOrderMessage(
            currentOrderItems,
            distributor
        );
}


// ===============================
// SEND WHATSAPP
// ===============================

function sendWhatsApp() {

    const distributor =
        getElement("distributor")
            .value
            .trim();


    const message =
        createOrderMessage(
            currentOrderItems,
            distributor
        );


    const whatsappURL =
        "https://wa.me/?text=" +
        encodeURIComponent(message);


    window.open(
        whatsappURL,
        "_blank"
    );
}


// ===============================
// SAVE ORDER
// ===============================

function saveOrder() {

    if (
        currentOrderItems.length === 0
    ) {

        return;
    }


    const distributor =
        getElement("distributor")
            .value
            .trim();


    const order = {

        id: Date.now(),

        distributor:
            distributor,

        items:
            currentOrderItems.map(
                function (item) {

                    return {
                        ...item
                    };

                }
            ),

        status: "ordered",

        createdAt:
            new Date().toISOString()

    };


    database.orders.push(order);


    const selectedIds =
        new Set(
            currentOrderItems.map(
                function (item) {

                    return item.id;

                }
            )
        );


    database.demands.forEach(
        function (item) {

            if (
                selectedIds.has(item.id)
            ) {

                item.status =
                    "ordered";

            }

        }
    );


    selectedDemands.clear();

    currentOrderItems = [];


    saveDatabase();


    closeOrderModal();


    showPage("orders");
}


// ===============================
// MARK ORDER RECEIVED
// ===============================

function markOrderReceived(orderId) {

    const order =
        database.orders.find(
            function (item) {

                return item.id === orderId;

            }
        );


    if (!order) {
        return;
    }


    const itemIds =
        new Set(
            order.items.map(
                function (item) {

                    return item.id;

                }
            )
        );


    database.demands.forEach(
        function (demand) {

            if (
                itemIds.has(demand.id)
            ) {

                demand.status =
                    "received";

            }

        }
    );


    order.status =
        "received";


    saveDatabase();


    renderApp();
}


// ===============================
// CLEAR LOCAL DATA
// ===============================

function clearLocalData() {

    const confirmed =
        confirm(
            "Clear all local demo data?"
        );


    if (!confirmed) {
        return;
    }


    database = {

        demands: [],

        orders: []

    };


    selectedDemands.clear();

    currentOrderItems = [];


    saveDatabase();


    renderApp();
}


// ===============================
// START APPLICATION
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const addDemandBtn =
            getElement("addDemandBtn");

        if (addDemandBtn) {

            addDemandBtn.addEventListener(
                "click",
                openDemandModal
            );

        }


        const closeModal =
            getElement("closeModal");

        if (closeModal) {

            closeModal.addEventListener(
                "click",
                closeDemandModal
            );

        }


        const demandModal =
            getElement("demandModal");

        if (demandModal) {

            const backdrop =
                demandModal.querySelector(
                    ".backdrop"
                );

            if (backdrop) {

                backdrop.addEventListener(
                    "click",
                    closeDemandModal
                );

            }

        }


        const plus =
            getElement("plus");

        if (plus) {

            plus.addEventListener(
                "click",
                increaseQuantity
            );

        }


        const minus =
            getElement("minus");

        if (minus) {

            minus.addEventListener(
                "click",
                decreaseQuantity
            );

        }


        const demandForm =
            getElement("demandForm");

        if (demandForm) {

            demandForm.addEventListener(
                "submit",
                saveDemand
            );

        }


        const makeOrderBtn =
            getElement("makeOrderBtn");

        if (makeOrderBtn) {

            makeOrderBtn.addEventListener(
                "click",
                openOrderModal
            );

        }


        const closeOrder =
            getElement("closeOrder");

        if (closeOrder) {

            closeOrder.addEventListener(
                "click",
                closeOrderModal
            );

        }


        const orderModal =
            getElement("orderModal");

        if (orderModal) {

            const backdrop =
                orderModal.querySelector(
                    ".backdrop"
                );

            if (backdrop) {

                backdrop.addEventListener(
                    "click",
                    closeOrderModal
                );

            }

        }


        const distributor =
            getElement("distributor");

        if (distributor) {

            distributor.addEventListener(
                "input",
                updateOrderPreview
            );

        }


        const whatsappBtn =
            getElement("whatsappBtn");

        if (whatsappBtn) {

            whatsappBtn.addEventListener(
                "click",
                sendWhatsApp
            );

        }


        const saveOrder
