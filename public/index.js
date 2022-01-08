/**
 * Requests inventory data from API and constructs a table view of data
 */
const populateTable = () => {
  // Ajax call to fetch list of items
  $.ajax({
    url: 'api/items',
    success: (res) => {
      if (res.ok) {
        // Empty table of existing data, if any
        $('#inventory-table-data').empty();
        const { items } = res;
        // Construct rows on table
        items.forEach((item) => {
          $('#inventory-table-data').append(`    
            <tr id='${item.id}'>
                <th scope="row">${item.id}</th>
                <td>${item.name}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>
                    <button type="button" class="btn btn-primary buttonEdit" title="Edit Item" data-bs-toggle="modal" data-bs-target="#modal"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn btn-danger buttonDelete" title="Delete Item"><i class="far fa-trash-alt"></i></button>
                </td>
            </tr>            
          `);
        });
      }
    },
  });
};

/**
 *
 * @param {Object} values an object containing the item properties
 * @returns API response body
 */
const createItem = (values) => {
  // Ajax call to create item
  const result = $.ajax({
    async: false,
    url: 'api/items/',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(values),
  });
  return result.responseJSON;
};

/**
 *
 * @param {String} id the ID of the item to update
 * @param {Object} values an object containing the new values for properties to update
 * @returns API response body
 */
const updateItem = (id, values) => {
  // Ajax call to update item
  const result = $.ajax({
    async: false,
    url: `api/items/${id}`,
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify(values),
  });
  return result.responseJSON;
};

/**
 *
 * @param {String} id ID of object to delete
 */
const deleteItem = (id) => {
  // Ajax call to delete item
  $.ajax({
    url: `api/items/${id}`,
    type: 'DELETE',
  });
};

/**
 * Handles refreshing the inventory table
 */
const handleRefresh = () => {
  populateTable();
};

/**
 * Handles the creation of an item
 */
const handleCreate = () => {
  // Change the modal submit button ID to indicate it's for creation
  $('#modalBaseSubmit').attr('id', 'modalCreateSubmit');
  // Restyle the modal
  $('#modalCreateSubmit').attr('class', 'btn btn-success');
  $('#modalCreateSubmit').text('Create');
  $('#modalTitle').text('Create New Item');
  $('#modalInputID').attr('placeholder', 'ID Assigned When Created');
};

/**
 * Handles exporting the inventory table
 */
const handleExport = () => {
  // Ajax request to retrieve csv string generated by API
  const { csv } = ($.ajax({
    async: false,
    url: 'api/export',
  })).responseJSON;

  // Trigger download of CSV file
  const hiddenElement = document.createElement('a');
  hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURI(csv)}`;
  hiddenElement.target = '_blank';
  hiddenElement.download = 'inventory.csv';
  hiddenElement.click();
};

const handleEdit = (event) => {
  // Change the modal submit button ID to indicate it's for editing
  $('#modalBaseSubmit').attr('id', 'modalEditSubmit');
  // Restyle the modal
  $('#modalEditSubmit').attr('class', 'btn btn-primary');
  $('#modalEditSubmit').text('Save Changes');
  $('#modalInputID').attr('placeholder', 'ID');
  $('#modalTitle').text('Edit Item');

  // Get ID of item from table row
  const { id } = event.currentTarget.parentElement.parentElement;

  // Ajax request to get item properties
  const values = ($.ajax({
    async: false,
    url: `api/items/${id}`,
  })).responseJSON.item;

  // Populate fields in modal form with item properties
  $('#modalInputID').val(values.id);
  $('#modalInputName').val(values.name);
  $('#modalInputDescription').val(values.description);
  $('#modalInputQuantity').val(values.quantity);
};

/**
 *
 * @param {Object} event the event sourced from the button that triggered the delete
 */
const handleDelete = (event) => {
  // Get ID of item from the table row ID
  const { id } = event.currentTarget.parentElement.parentElement;

  deleteItem(id);
  handleRefresh();
};

/**
 * Handle closing the modal
 */
const handleModalClose = () => {
  $('#modal').modal('hide');
  // Restyle modal
  $('#modalEditSubmit, #modalCreateSubmit').attr('id', 'modalBaseSubmit');
  $('#modalEditSubmit, #modalCreateSubmit').attr('class', 'btn');

  $('#modalAlert').attr('hidden', true);
  $('#modalForm').trigger('reset');
};

/**
 * Handle submitting the modal
 * @param {*} event even sourced from what triggered the submit
 */
const handleModalSubmit = (event) => {
  // Check if modal is for creation or update of an item
  const isCreate = event.target.id === 'modalCreateSubmit';

  // Hide alert banner if exists
  $('#modalAlert').attr('hidden', true);

  // Get values from input fields
  const name = $('#modalInputName').val();
  const description = $('#modalInputDescription').val();
  const quantity = $('#modalInputQuantity').val();

  let result;

  if (isCreate) {
    // Create the new item
    result = createItem({ name, description, quantity });
  } else {
    // Get id of item to update
    const id = $('#modalInputID').val();

    // Get original (not updated) item properties
    const original = ($.ajax({
      async: false,
      url: `api/items/${id}`,
    })).responseJSON.item;

    const values = {};

    console.log(name, description, quantity);
    console.log(original);

    // Validate form data
    if (!(name === original.name) && name !== '') {
      values.name = name;
    }

    if (!(description === original.description) && description !== '') {
      values.description = description;
    }

    if (!(Number(quantity) === original.quantity) && quantity !== '') {
      values.quantity = quantity;
    }

    console.log(values);

    result = updateItem(id, values);
  }

  if (!result.ok) {
    // If API request not successful, display error on banner
    $('#modalAlert').attr('hidden', false);
    $('#modalAlert').text(result.message);
  } else {
    handleModalClose();
    handleRefresh();
  }
};

$(document).ready(() => {
  // Initially populate table
  populateTable();

  // Listeners
  $('#buttonCreate').click(() => {
    handleCreate();
  });

  $('#buttonRefresh').click(() => {
    handleRefresh();
  });

  $('#buttonExport').click(() => {
    handleExport();
  });

  $('.modalCloseButton').click(() => {
    handleModalClose();
  });

  $('#inventory-table-data').on('click', 'button.buttonEdit', (event) => {
    handleEdit(event);
  });

  $('#inventory-table-data').on('click', 'button.buttonDelete', (event) => {
    handleDelete(event);
  });

  $('.buttonModalSubmit').click((event) => {
    handleModalSubmit(event);
  });
});
