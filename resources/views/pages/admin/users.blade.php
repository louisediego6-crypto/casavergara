@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <title>User Management - Casa Vergara</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260830i" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
</head>
<body>
  <div class="admin-wrap admin-page admin-users-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="d-flex justify-content-between align-items-center mb-4 admin-page-head flex-wrap gap-3">
        <div>
          <h1 class="h2 text-brand mb-1">User Management</h1>
          <p class="text-muted-brand mb-0">Search, filter, and manage every account on the site</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span id="usersLiveIndicator" class="small text-muted-brand"><i class="bi bi-arrow-repeat me-1"></i>Updating…</span>
          <button type="button" class="btn btn-outline-secondary btn-sm" id="usersRefreshBtn"><i class="bi bi-arrow-clockwise me-1"></i>Refresh now</button>
          <button type="button" class="btn btn-brand btn-sm" id="usersAddBtn"><i class="bi bi-plus-lg me-1"></i>Add User</button>
        </div>
      </div>

      <div class="row g-3 mb-4 admin-kpi-grid">
        <div class="col-6 col-md-2"><div class="soft-card p-3"><small>Total</small><h3 id="usersKpiTotal">—</h3></div></div>
        <div class="col-6 col-md-2"><div class="soft-card p-3"><small>Customers</small><h3 id="usersKpiCustomers">—</h3></div></div>
        <div class="col-6 col-md-2"><div class="soft-card p-3"><small>Admins</small><h3 id="usersKpiAdmins">—</h3></div></div>
        <div class="col-6 col-md-2"><div class="soft-card p-3"><small>Event Managers</small><h3 id="usersKpiEventManagers">—</h3></div></div>
        <div class="col-6 col-md-2"><div class="soft-card p-3"><small class="text-success">Active</small><h3 id="usersKpiActive" class="text-success">—</h3></div></div>
        <div class="col-6 col-md-2"><div class="soft-card p-3"><small class="text-danger">Suspended</small><h3 id="usersKpiSuspended" class="text-danger">—</h3></div></div>
      </div>

      <div class="soft-card p-3 mb-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label small text-muted-brand mb-1" for="usersSearchInput">Search</label>
            <input type="text" class="form-control" id="usersSearchInput" placeholder="Name, email, or phone">
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="usersRoleFilter">Role</label>
            <select class="form-select" id="usersRoleFilter">
              <option value="all">All roles</option>
              <option value="customer">Customer</option>
              <option value="event_manager">Event Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted-brand mb-1" for="usersStatusFilter">Status</label>
            <select class="form-select" id="usersStatusFilter">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div class="col-md-1">
            <span class="badge text-bg-light border" id="usersResultCount">0</span>
          </div>
        </div>
      </div>

      <div id="usersAlert" class="alert d-none small" role="alert"></div>

      <div class="soft-card p-3 admin-table-card">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Joined</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody"></tbody>
          </table>
          <div id="usersEmptyRow" class="text-center text-muted-brand py-4 d-none">No accounts match your filters.</div>
        </div>
      </div>
    </main>
  </div>

  <div class="modal fade" id="userModal" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="userModalLabel">Add User</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="userFormAlert" class="alert d-none small" role="alert"></div>
          <form id="userForm" class="row g-3">
            <input type="hidden" id="userFormId" value="0">
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="userFormFirstName">First name</label>
              <input type="text" class="form-control" id="userFormFirstName" maxlength="100" required>
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="userFormLastName">Last name</label>
              <input type="text" class="form-control" id="userFormLastName" maxlength="100" required>
            </div>
            <div class="col-md-7">
              <label class="form-label small text-muted-brand mb-1" for="userFormEmail">Email</label>
              <input type="email" class="form-control" id="userFormEmail" maxlength="191" required>
            </div>
            <div class="col-md-5">
              <label class="form-label small text-muted-brand mb-1" for="userFormPhone">Phone</label>
              <input type="tel" class="form-control" id="userFormPhone" maxlength="30" required>
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="userFormRole">Role</label>
              <select class="form-select" id="userFormRole">
                <option value="customer">Customer</option>
                <option value="event_manager">Event Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="userFormStatus">Status</label>
              <select class="form-select" id="userFormStatus">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="userFormPassword">Password</label>
              <input type="password" class="form-control" id="userFormPassword" minlength="6" autocomplete="new-password">
              <div class="form-text" id="userFormPasswordHint">At least 6 characters.</div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="userSaveBtn">
            <span class="admin-btn-label">Save User</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="userDeleteModal" tabindex="-1" aria-labelledby="userDeleteModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="userDeleteModalLabel"><i class="bi bi-exclamation-triangle text-danger me-2"></i>Delete account</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">Permanently delete <strong id="userDeleteName">this account</strong>? This cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" id="userDeleteConfirmBtn">
            <span class="admin-btn-label">Delete</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/admin-users.js?v=20260830i"></script>
  <script>renderAdminSidebar("users"); initAdminUsersPage();</script>
</body>
</html>

@endverbatim
