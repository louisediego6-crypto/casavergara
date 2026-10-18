@verbatim
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <title>Site Content - Casa Vergara Admin</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../../css/style.css?v=20260926c" rel="stylesheet">
  <link href="../../css/polish.css?v=20260926a" rel="stylesheet">
  <link href="../../css/modern.css?v=20261018a" rel="stylesheet">
  <link href="../../css/laravel-ui.css?v=20261018b" rel="stylesheet">
  <link href="../../css/admin-modern.css?v=20261018a" rel="stylesheet">
  <style>

    .site-image-card { display: flex; flex-direction: column; gap: .75rem; }
    .site-image-thumb-wrap {
      position: relative;
      border-radius: .75rem;
      overflow: hidden;
      background: var(--bs-tertiary-bg, #f1f1f1);
      aspect-ratio: 16 / 10;
    }
    .site-image-thumb-wrap img {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .site-image-thumb-wrap .spinner-border { position: absolute; top: 50%; left: 50%; margin: -0.75rem; }
    .site-image-badge { position: absolute; top: .5rem; left: .5rem; }
    .site-text-card { display: flex; flex-direction: column; gap: .5rem; }
    #siteContentTabs .nav-link { display: flex; align-items: center; gap: .4rem; }
  </style>
</head>
<body>
  <div class="admin-wrap admin-page">
    <div id="admin-sidebar"></div>
    <main class="admin-main">
      <div class="admin-page-head mb-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span class="settings-eyebrow"><i class="bi bi-file-earmark-richtext me-1"></i>Administration</span>
            <h1 class="h2 text-brand mb-1 mt-2">Site Content</h1>
            <p class="text-muted-brand mb-0">Everything guests read on the public site — wording, photos, room &amp; event packages, FAQs, reviews, legal pages and team profiles — lives here now. Changes appear on the live site right away.</p>
          </div>
        </div>
      </div>

      <ul class="nav nav-pills mb-4 flex-wrap" id="siteContentTabs" role="tablist">
        <li class="nav-item" data-admin-only="1">
          <button type="button" class="nav-link active" data-bs-toggle="pill" data-bs-target="#tab-text" type="button">
            <i class="bi bi-fonts"></i>Page Text
          </button>
        </li>
        <li class="nav-item" data-admin-only="1">
          <button type="button" class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-photos" type="button">
            <i class="bi bi-images"></i>Photos
          </button>
        </li>
        <li class="nav-item">
          <button type="button" class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-packages" type="button">
            <i class="bi bi-box-seam"></i>Packages
          </button>
        </li>
        <li class="nav-item">
          <button type="button" class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-faqs" type="button">
            <i class="bi bi-question-circle"></i>FAQs
          </button>
        </li>
        <li class="nav-item">
          <button type="button" class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-reviews">
            <i class="bi bi-star"></i>Reviews
          </button>
        </li>
        <li class="nav-item" data-admin-only="1">
          <button type="button" class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-legal" type="button">
            <i class="bi bi-file-earmark-text"></i>Legal Content
          </button>
        </li>
        <li class="nav-item">
          <button type="button" class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-team" type="button">
            <i class="bi bi-people-fill"></i>Our Team
          </button>
        </li>
      </ul>

      <div class="tab-content" id="siteContentTabContent">

        <div class="tab-pane fade show active" id="tab-text" role="tabpanel">
          <p class="text-muted-brand small mb-3">Headlines, intro paragraphs and shared details (like the footer's address and phone number) that appear on the public pages. Fields under "Global (Footer)" appear on every page at once, so there's only one place to fix them.</p>
          <div id="siteTextAlert" class="alert d-none small mb-4" role="alert"></div>
          <div id="siteTextLoading" class="text-center text-muted-brand py-5">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>Loading page text&hellip;
          </div>
          <div id="siteTextGroups" class="d-none"></div>
        </div>

        <div class="tab-pane fade" id="tab-photos" role="tabpanel">
          <p class="text-muted-brand small mb-3">Swap out the photos shown on your public website — no code changes needed.</p>
          <div id="siteContentAlert" class="alert d-none small mb-4" role="alert"></div>
          <div id="siteContentLoading" class="text-center text-muted-brand py-5">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>Loading photos&hellip;
          </div>
          <div id="siteContentGroups" class="d-none"></div>
        </div>

        <div class="tab-pane fade" id="tab-packages" role="tabpanel">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <p class="text-muted-brand mb-0">Add, edit, or delete room and event packages, and manage each package's paid lighting, sound, and extra add-ons. Deactivated packages are hidden from the public booking page.</p>
          </div>

          <div id="adminPackagesAlert" class="alert d-none small" role="alert"></div>

          <div class="soft-card p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-brand mb-0"><i class="bi bi-calendar-event me-2"></i>Event Packages</h5>
              <button type="button" class="btn btn-brand btn-sm admin-only-action" id="addEventPackageBtn"><i class="bi bi-plus-lg me-1"></i>Add package</button>
            </div>
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr class="small text-muted-brand">
                    <th style="width:70px;">Order</th>
                    <th>Package</th>
                    <th>Starting price</th>
                    <th>Guests</th>
                    <th>Motifs</th>
                    <th>Add-ons</th>
                    <th class="text-end">Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody id="adminEventPackagesBody"></tbody>
              </table>
            </div>
          </div>

          <div class="soft-card p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-brand mb-0"><i class="bi bi-door-open me-2"></i>Room Packages</h5>
              <button type="button" class="btn btn-brand btn-sm admin-only-action" id="addRoomPackageBtn"><i class="bi bi-plus-lg me-1"></i>Add package</button>
            </div>
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr class="small text-muted-brand">
                    <th style="width:70px;">Order</th>
                    <th>Package</th>
                    <th>Starting price</th>
                    <th>Capacity</th>
                    <th>Add-ons</th>
                    <th class="text-end">Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody id="adminRoomPackagesBody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="tab-pane fade" id="tab-faqs" role="tabpanel">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
            <p class="text-muted-brand mb-0">Add, edit and publish the questions and answers guests see on the FAQs page. Active entries appear instantly on the website.</p>
            <div class="d-flex gap-2 flex-wrap">
              <div class="btn-group" role="group" aria-label="FAQ view">
                <button type="button" class="btn btn-outline-secondary active" id="faqViewTableBtn" data-view="table">
                  <i class="bi bi-table me-1"></i>Table
                </button>
                <button type="button" class="btn btn-outline-secondary" id="faqViewCardsBtn" data-view="cards">
                  <i class="bi bi-card-text me-1"></i>Preview
                </button>
              </div>
              <a class="btn btn-outline-primary" href="../faq.html" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-1"></i>View FAQs page</a>
              <button type="button" class="btn btn-brand" id="faqAddBtn"><i class="bi bi-plus-lg me-1"></i>Add FAQ</button>
            </div>
          </div>

          <div id="faqRoleNote" class="alert alert-info small d-none" role="alert"></div>
          <div id="faqAlert" class="alert d-none small" role="alert"></div>

          <div class="soft-card p-3 mb-3">
            <div class="row g-3 align-items-end">
              <div class="col-md-6">
                <label class="form-label small text-muted-brand mb-1" for="faqSearchInput">Search</label>
                <input type="text" class="form-control" id="faqSearchInput" placeholder="Search question or answer">
              </div>
              <div class="col-md-4">
                <label class="form-label small text-muted-brand mb-1" for="faqCategoryFilter">Category</label>
                <select class="form-select" id="faqCategoryFilter">
                  <option value="all">All categories</option>
                </select>
              </div>
              <div class="col-md-2">
                <span class="badge text-bg-light border" id="faqResultCount">0</span>
              </div>
            </div>
          </div>

          <div class="soft-card p-3 admin-table-card" id="faqTableView">
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Category</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody id="faqTableBody"></tbody>
              </table>
              <div id="faqEmptyRow" class="text-center text-muted-brand py-4 d-none">No FAQs match your filters.</div>
            </div>
          </div>

          <div id="faqCardsView" class="d-none">
            <div id="faqCardsWrap"></div>
            <div id="faqCardsEmpty" class="soft-card p-4 text-center text-muted-brand d-none">No FAQs match your filters.</div>
          </div>
        </div>

        <div class="tab-pane fade" id="tab-reviews" role="tabpanel">
          <p class="text-muted-brand mb-3">Moderate guest reviews submitted on the homepage. Hidden reviews stay on file but won't show to visitors.</p>
              <div id="reviewsAlert" class="alert d-none small" role="alert"></div>

              <div class="soft-card p-3 mb-3">
                <div class="row g-3 align-items-end">
                  <div class="col-md-6">
                    <label class="form-label small text-muted-brand mb-1" for="reviewsSearchInput">Search</label>
                <input type="text" class="form-control" id="reviewsSearchInput" placeholder="Search guest name, email, or review text">
              </div>
              <div class="col-md-4">
                <label class="form-label small text-muted-brand mb-1" for="reviewsStatusFilter">Status</label>
                <select class="form-select" id="reviewsStatusFilter">
                  <option value="all">All statuses</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div class="col-md-2">
                <span class="badge text-bg-light border" id="reviewsResultCount">0</span>
              </div>
            </div>
          </div>

          <div class="soft-card p-3 admin-table-card">
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Booking</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Posted</th>
                    <th>Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody id="reviewsTableBody"></tbody>
              </table>
              <div id="reviewsEmptyRow" class="text-center text-muted-brand py-4 d-none">No reviews match your filters.</div>
            </div>
          </div>
        </div>

        <div class="tab-pane fade" id="tab-legal" role="tabpanel">
          <p class="text-muted-brand mb-3">Edit the Privacy Policy and Terms &amp; Conditions shown on the public site.</p>

          <ul class="nav nav-pills mb-4 cvr-legal-tabs" id="adminLegalTabs">
            <li class="nav-item"><button type="button" class="nav-link active" data-type="privacy">Privacy Policy</button></li>
            <li class="nav-item"><button type="button" class="nav-link" data-type="room">Terms — Room Bookings</button></li>
            <li class="nav-item"><button type="button" class="nav-link" data-type="event">Terms — Event Bookings</button></li>
          </ul>

          <div id="adminLegalAlert" class="alert d-none small" role="alert"></div>

          <div class="row g-4">
            <div class="col-lg-7">
              <div class="soft-card p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5 class="text-brand mb-0" id="adminLegalDocTitle">Privacy Policy</h5>
                  <span class="small text-muted-brand" id="adminLegalCurrentVersion">Loading…</span>
                </div>
                <label class="form-label small text-muted-brand mb-1" for="adminLegalVersion">New version number</label>
                <input type="text" class="form-control mb-3" id="adminLegalVersion" style="max-width:160px;" placeholder="e.g. 1.1">
                <label class="form-label small text-muted-brand mb-1" for="adminLegalContent">Content</label>
                <p class="small text-muted-brand mb-2">
                  Write each section as <code>## Section Title</code> on its own line, followed by the section text.
                  Leave a blank line between sections — that's how they get split into the numbered list guests see.
                </p>
                <textarea class="form-control" id="adminLegalContent" rows="20" style="font-family: ui-monospace, monospace; font-size: 0.85rem;"></textarea>
                <div class="d-flex gap-2 mt-3">
                  <button type="button" class="btn btn-brand" id="adminLegalSaveBtn">
                    <span class="admin-btn-label"><i class="bi bi-upload me-1"></i>Publish new version</span>
                    <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
                  </button>
                  <button type="button" class="btn btn-outline-secondary" id="adminLegalPreviewBtn">
                    <i class="bi bi-eye me-1"></i>Preview
                  </button>
                </div>
                <p class="small text-muted-brand mt-2 mb-0">Publishing keeps the previous version in history — it doesn't delete it — and immediately becomes what guests see on the public page.</p>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="soft-card p-4">
                <h6 class="text-brand mb-3"><i class="bi bi-eye me-1"></i>Live preview</h6>
                <div id="adminLegalPreview" class="cvr-legal-body"><p class="text-muted-brand small">Click "Preview" to see how this will look on the website.</p></div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-pane fade" id="tab-team" role="tabpanel">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
            <p class="text-muted-brand mb-0">Edit the "Meet Our Leadership" profiles shown on the public About Us page. Admin and staff accounts can both manage this.</p>
            <button type="button" class="btn btn-brand" id="teamAddBtn"><i class="bi bi-plus-lg me-1"></i>Add member</button>
          </div>

          <div id="teamAlert" class="alert d-none small" role="alert"></div>

          <div class="soft-card p-3 admin-table-card">
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr>
                    <th style="width:70px;">Photo</th>
                    <th>Name &amp; role</th>
                    <th>Email</th>
                    <th>Bio</th>
                    <th style="width:90px;">Order</th>
                    <th style="width:110px;">Visible</th>
                    <th class="text-end" style="width:170px;">Actions</th>
                  </tr>
                </thead>
                <tbody id="teamTableBody"></tbody>
              </table>
              <div id="teamEmptyRow" class="text-center text-muted-brand py-4 d-none">No team profiles yet. Click "Add member" to create the first one.</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <template id="siteImageCardTemplate">
    <div class="col-md-6 col-xl-4">
      <div class="soft-card p-3 site-image-card h-100">
        <div class="site-image-thumb-wrap">
          <span class="badge text-bg-secondary site-image-badge d-none" data-role="badge">Custom</span>
          <img data-role="thumb" alt="">
        </div>
        <div>
          <h6 class="text-brand mb-1" data-role="label"></h6>
          <small class="text-muted-brand" data-role="page"></small>
        </div>
        <div class="alert d-none small py-2 mb-0" data-role="alert" role="alert"></div>
        <input type="file" class="d-none" accept="image/jpeg,image/png,image/webp,image/gif" data-role="file">
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-outline-primary btn-sm flex-grow-1" data-role="upload-btn">
            <i class="bi bi-upload me-1"></i><span class="admin-btn-label">Replace photo</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm" data-role="reset-btn" disabled>
            <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
          </button>
        </div>
      </div>
    </div>
  </template>

  <template id="siteTextCardTemplate">
    <div class="col-md-6">
      <div class="soft-card p-3 site-text-card h-100">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <h6 class="text-brand mb-0" data-role="label"></h6>
          <span class="badge text-bg-secondary d-none flex-shrink-0" data-role="badge">Custom</span>
        </div>
        <small class="text-muted-brand" data-role="page"></small>
        <input type="text" class="form-control form-control-sm" data-role="input-text">
        <textarea class="form-control form-control-sm d-none" rows="3" data-role="input-textarea"></textarea>
        <div class="alert d-none small py-2 mb-0" data-role="alert" role="alert"></div>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-outline-primary btn-sm flex-grow-1" data-role="save-btn">
            <span class="admin-btn-label"><i class="bi bi-check2 me-1"></i>Save</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm" data-role="reset-btn" disabled>
            <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
          </button>
        </div>
      </div>
    </div>
  </template>

  <div class="modal fade" id="faqModal" tabindex="-1" aria-labelledby="faqModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="faqModalLabel">Add FAQ</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="faqForm" class="row g-3">
            <input type="hidden" id="faqFormId" value="0">
            <div class="col-md-8">
              <label class="form-label small text-muted-brand mb-1" for="faqFormQuestion">Question</label>
              <input type="text" class="form-control" id="faqFormQuestion" maxlength="255" required>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted-brand mb-1" for="faqFormCategory">Category</label>
              <input type="text" class="form-control" id="faqFormCategory" maxlength="100" list="faqCategoryOptions" placeholder="General">
              <datalist id="faqCategoryOptions"></datalist>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="faqFormAnswer">Answer</label>
              <textarea class="form-control" id="faqFormAnswer" rows="5" required></textarea>
              <div class="form-text">This is the exact, predetermined answer guests will see for this question.</div>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted-brand mb-1" for="faqFormSortOrder">Display order</label>
              <input type="number" class="form-control" id="faqFormSortOrder" value="0" step="1">
              <div class="form-text">Lower numbers show first within a category.</div>
            </div>
            <div class="col-md-8 d-flex align-items-end">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="faqFormActive" checked>
                <label class="form-check-label" for="faqFormActive">Visible to guests</label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="faqSaveBtn">
            <span class="admin-btn-label">Save FAQ</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="teamEditModal" tabindex="-1" aria-labelledby="teamEditModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="teamEditModalLabel">Edit team profile</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="teamEditAlert" class="alert alert-danger d-none small" role="alert"></div>
          <form id="teamEditForm" class="row g-3">
            <input type="hidden" id="teamEditId" value="0">
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="teamEditName">Full name</label>
              <input type="text" class="form-control" id="teamEditName" maxlength="150" placeholder="Maria Vergara">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="teamEditRole">Role / title</label>
              <input type="text" class="form-control" id="teamEditRole" maxlength="150" placeholder="Founder &amp; CEO">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="teamEditEmail">Email (optional)</label>
              <input type="email" class="form-control" id="teamEditEmail" maxlength="190" placeholder="name@casavergararesort.com">
              <div class="form-text small">Powers the "Get in touch" button on this profile's public pop-up — it opens Gmail addressed straight to this person. Leave blank to send guests to the general Contact page instead.</div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1">Profile photo</label>
              <div class="d-flex align-items-start gap-3">
                <div class="text-center flex-shrink-0">
                  <img id="teamEditPhotoPreview" src="" alt="" class="rounded-circle border d-none" style="width:72px;height:72px;object-fit:cover;">
                  <div id="teamEditPhotoEmpty" class="rounded-circle border d-flex align-items-center justify-content-center text-muted-brand" style="width:72px;height:72px;background:#f2f5f8;"><i class="bi bi-person fs-4"></i></div>
                  <button type="button" class="btn btn-link btn-sm text-danger p-0 mt-1 d-none" id="teamEditPhotoClear">Remove</button>
                </div>
                <div class="flex-grow-1">
                  <div class="row g-2 align-items-end">
                    <div class="col-md-6">
                      <label class="form-label small text-muted-brand mb-1" for="teamEditPhotoFile">Upload a file</label>
                      <input type="file" class="form-control" id="teamEditPhotoFile" accept="image/jpeg,image/png,image/webp">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted-brand mb-1" for="teamEditPhoto">Or paste a photo URL</label>
                      <input type="text" class="form-control" id="teamEditPhoto" maxlength="500" placeholder="https://...">
                    </div>
                  </div>
                  <div class="form-text small">JPG, PNG or WEBP up to 3 MB — or a direct image link. Either way it shows on the About Us page.</div>
                </div>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="teamEditBio">Short bio</label>
              <textarea class="form-control" id="teamEditBio" rows="4" maxlength="2000" placeholder="A sentence or two shown in the profile pop-up."></textarea>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="teamEditFacts">Highlights (one per line, max 6)</label>
              <textarea class="form-control" id="teamEditFacts" rows="4" maxlength="1000" placeholder="15+ years in hospitality leadership&#10;Drives our sustainability program"></textarea>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted-brand mb-1" for="teamEditOrder">Display order</label>
              <input type="number" class="form-control" id="teamEditOrder" min="0" max="999" value="0">
            </div>
            <div class="col-md-8 d-flex align-items-end">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="teamEditVisible" checked>
                <label class="form-check-label small" for="teamEditVisible">Show this profile on the public About Us page</label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="teamEditSaveBtn">
            <span class="admin-btn-label"><i class="bi bi-check2 me-1"></i>Save profile</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="teamViewModal" tabindex="-1" aria-labelledby="teamViewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content overflow-hidden">
        <div class="modal-header">
          <h5 class="modal-title" id="teamViewModalLabel"><i class="bi bi-person-badge me-2"></i>Team profile</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-0">
          <div class="row g-0">
            <div class="col-sm-5">
              <img id="teamViewPhoto" src="" alt="" class="w-100 h-100" style="object-fit:cover;min-height:220px;background:#eef2f6;">
            </div>
            <div class="col-sm-7">
              <div class="p-4">
                <p class="text-uppercase small text-primary fw-semibold mb-1" id="teamViewRole"></p>
                <h4 class="text-brand fw-bold mb-2" id="teamViewName"></h4>
                <span class="badge mb-3" id="teamViewVisible"></span>
                <p class="small text-muted-brand mb-2" id="teamViewEmail"></p>
                <p class="text-muted-brand" id="teamViewBio"></p>
                <ul class="list-unstyled small text-muted-brand mb-0" id="teamViewFacts"></ul>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-brand" id="teamViewEditBtn"><i class="bi bi-pencil me-1"></i>Edit profile</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="eventPackageModal" tabindex="-1" aria-labelledby="eventPackageModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="eventPackageModalLabel">Add Event Package</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="eventPackageFormAlert" class="alert d-none small" role="alert"></div>
          <form id="eventPackageForm" class="row g-3">
            <input type="hidden" id="epFormOriginalKey" value="">
            <div class="col-md-8">
              <label class="form-label small text-muted-brand mb-1" for="epFormName">Package name</label>
              <input type="text" class="form-control" id="epFormName" maxlength="100" placeholder="e.g. Ayesha Package" required>
              <div class="form-text" id="epFormNameHint">Used as the package's unique identifier and can't be changed once created.</div>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted-brand mb-1" for="epFormPrice">Base price (₱)</label>
              <input type="number" class="form-control" id="epFormPrice" min="0" max="1000000" step="1" placeholder="9000" required>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted-brand mb-1" for="epFormPax">Guests (pax)</label>
              <input type="number" class="form-control" id="epFormPax" min="1" max="2000" step="1" placeholder="50" required>
            </div>
            <div class="col-md-4 d-flex align-items-center pt-4">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="epFormActive" checked>
                <label class="form-check-label small" for="epFormActive">Active (bookable)</label>
              </div>
            </div>
            <div class="col-md-4 d-flex align-items-center pt-4">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="epFormCustom">
                <label class="form-check-label small" for="epFormCustom">Mix &amp; match package</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="epFormPhoto">Package photo</label>
              <div class="d-flex align-items-start gap-3 flex-wrap">
                <img id="epFormPhotoPreview" src="../../images/booking-photo-3.png" alt="Package photo preview" class="rounded-3 border" style="width:160px;height:110px;object-fit:cover;">
                <div class="flex-grow-1">
                  <input type="file" class="form-control" id="epFormPhoto">
                  <input type="hidden" id="epFormImage" value="">
                  <div class="form-text">Any file type, up to 5 MB. Use a photo (JPG/PNG/WEBP) so it displays correctly on the booking page — other file types upload but won't preview as an image.</div>
                  <button type="button" class="btn btn-outline-secondary btn-sm mt-2 d-none" id="epFormPhotoRemove"><i class="bi bi-x-lg me-1"></i>Remove photo</button>
                </div>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="epFormInclusions">Inclusions (one per line)</label>
              <textarea class="form-control" id="epFormInclusions" rows="4" placeholder="Celebrant chair&#10;Cake table &amp; souvenir stand"></textarea>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="epFormMotifs">Motifs (one per line, format: Label | Colors)</label>
              <textarea class="form-control" id="epFormMotifs" rows="3" placeholder="Pastel Rainbow | Pink · Lavender · Mint"></textarea>
            </div>
            <div class="col-12">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label small text-muted-brand mb-0">Lighting, sound &amp; extra add-ons</label>
                <button type="button" class="btn btn-outline-secondary btn-sm" id="epAddAddOnRowBtn"><i class="bi bi-plus-lg me-1"></i>Add option</button>
              </div>
              <p class="small text-muted-brand mb-2">Each option is shown to the customer with its price next to it — they can pick any combination and the total updates live. Use a realistic price for each item.</p>
              <div id="epAddOnRows" class="vstack gap-2"></div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="epSaveBtn">
            <span class="admin-btn-label">Save Package</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="roomPackageModal" tabindex="-1" aria-labelledby="roomPackageModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="roomPackageModalLabel">Add Room Package</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="roomPackageFormAlert" class="alert d-none small" role="alert"></div>
          <form id="roomPackageForm" class="row g-3">
            <input type="hidden" id="rpFormId" value="">
            <div class="col-md-8">
              <label class="form-label small text-muted-brand mb-1" for="rpFormTitle">Room title</label>
              <input type="text" class="form-control" id="rpFormTitle" maxlength="100" placeholder="e.g. Deluxe Room" required>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted-brand mb-1" for="rpFormPrice">Price / night (₱)</label>
              <input type="number" class="form-control" id="rpFormPrice" min="0" max="1000000" step="1" placeholder="6500" required>
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="rpFormTagline">Tagline</label>
              <input type="text" class="form-control" id="rpFormTagline" maxlength="150" placeholder="Private pool villa with garden views">
            </div>
            <div class="col-md-3">
              <label class="form-label small text-muted-brand mb-1" for="rpFormCapMin">Min guests</label>
              <input type="number" class="form-control" id="rpFormCapMin" min="1" max="50" step="1" placeholder="1" required>
            </div>
            <div class="col-md-3">
              <label class="form-label small text-muted-brand mb-1" for="rpFormCapMax">Max guests</label>
              <input type="number" class="form-control" id="rpFormCapMax" min="1" max="50" step="1" placeholder="4" required>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="rpFormDescription">Description</label>
              <textarea class="form-control" id="rpFormDescription" rows="2" placeholder="Spacious 85 m² villa with a private pool..."></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="rpFormArea">Area (m²)</label>
              <input type="number" class="form-control" id="rpFormArea" min="0" max="1000" step="1" placeholder="85">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted-brand mb-1" for="rpFormBed">Bed configuration</label>
              <input type="text" class="form-control" id="rpFormBed" maxlength="100" placeholder="1 King Bed">
            </div>
            <div class="col-md-6 d-flex align-items-center">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="rpFormActive" checked>
                <label class="form-check-label small" for="rpFormActive">Active (bookable)</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="rpFormPhoto">Room photo</label>
              <div class="d-flex align-items-start gap-3 flex-wrap">
                <img id="rpFormPhotoPreview" src="../../images/booking-photo-1.png" alt="Room photo preview" class="rounded-3 border" style="width:160px;height:110px;object-fit:cover;">
                <div class="flex-grow-1">
                  <input type="file" class="form-control" id="rpFormPhoto">
                  <input type="hidden" id="rpFormImage" value="">
                  <div class="form-text">Any file type, up to 5 MB. Use a photo (JPG/PNG/WEBP) so it displays correctly on the booking page — other file types upload but won't preview as an image.</div>
                  <button type="button" class="btn btn-outline-secondary btn-sm mt-2 d-none" id="rpFormPhotoRemove"><i class="bi bi-x-lg me-1"></i>Reset to default photo</button>
                </div>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-muted-brand mb-1" for="rpFormInclusions">Inclusions (one per line)</label>
              <textarea class="form-control" id="rpFormInclusions" rows="3" placeholder="Private pool&#10;Garden view&#10;Wi‑Fi"></textarea>
            </div>
            <div class="col-12">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label small text-muted-brand mb-0">Optional paid add-ons</label>
                <button type="button" class="btn btn-outline-secondary btn-sm" id="rpAddAddOnRowBtn"><i class="bi bi-plus-lg me-1"></i>Add option</button>
              </div>
              <p class="small text-muted-brand mb-2">Shown to the customer with its price next to it on the reservation step. Use a realistic price for each item.</p>
              <div id="rpAddOnRows" class="vstack gap-2"></div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-brand" id="rpSaveBtn">
            <span class="admin-btn-label">Save Package</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="packageViewModal" tabindex="-1" aria-labelledby="packageViewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="packageViewModalLabel"><i class="bi bi-eye me-2"></i>Package details</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="d-flex flex-wrap gap-3 mb-3">
            <img id="pkgViewImage" src="" alt="" class="rounded-3 border" style="width:180px;height:130px;object-fit:cover;">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <h5 class="text-brand fw-bold mb-1" id="pkgViewTitle"></h5>
                <span class="badge" id="pkgViewStatus"></span>
              </div>
              <p class="small text-muted-brand mb-1" id="pkgViewTagline"></p>
              <div class="fw-semibold text-brand" id="pkgViewPrice"></div>
              <div class="small text-muted-brand" id="pkgViewCapacity"></div>
            </div>
          </div>
          <p class="mb-3" id="pkgViewDescription"></p>
          <div class="row g-3">
            <div class="col-md-6" id="pkgViewInclusionsWrap">
              <h6 class="text-brand small text-uppercase">Inclusions</h6>
              <ul class="small mb-0" id="pkgViewInclusions"></ul>
            </div>
            <div class="col-md-6 d-none" id="pkgViewMotifsWrap">
              <h6 class="text-brand small text-uppercase">Motifs</h6>
              <ul class="small mb-0" id="pkgViewMotifs"></ul>
            </div>
          </div>
          <div class="mt-3" id="pkgViewAddOnsWrap">
            <h6 class="text-brand small text-uppercase">Add-ons</h6>
            <ul class="small mb-0" id="pkgViewAddOns"></ul>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="packageDeleteModal" tabindex="-1" aria-labelledby="packageDeleteModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="packageDeleteModalLabel"><i class="bi bi-exclamation-triangle text-danger me-2"></i>Delete package</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">Permanently delete <strong id="packageDeleteName">this package</strong>? It will be hidden from the booking page and this can't be undone.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" id="packageDeleteConfirmBtn">
            <span class="admin-btn-label">Delete</span>
            <span class="spinner-border spinner-border-sm ms-1 d-none" role="status" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

   (opens when a row is clicked). -->
  <div class="modal fade" id="reviewViewModal" tabindex="-1" aria-labelledby="reviewViewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="reviewViewModalLabel"><i class="bi bi-chat-quote me-2"></i>Guest review</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h5 class="text-brand fw-bold mb-1" id="reviewViewName"></h5>
              <div class="small text-muted-brand" id="reviewViewEmail"></div>
              <div class="small text-muted-brand" id="reviewViewLocation"></div>
            </div>
            <div class="text-end">
              <div class="mb-1" id="reviewViewStars"></div>
              <span class="badge" id="reviewViewStatus"></span>
              <div class="small text-muted-brand mt-1" id="reviewViewDate"></div>
            </div>
          </div>
          <p class="mb-0" id="reviewViewComment" style="white-space:pre-wrap;"></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-outline-secondary admin-only-action" id="reviewViewToggleBtn"></button>
          <button type="button" class="btn btn-danger admin-only-action" id="reviewViewDeleteBtn"><i class="bi bi-trash me-1"></i>Delete review</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../../js/main.js?v=20260926b"></script>
  <script src="../../js/legal-doc.js?v=20260830i"></script>
  <script src="../../js/admin-site-content.js?v=20260926a"></script>
  <script src="../../js/booking-data.js?v=20260924d"></script>
  <script src="../../js/admin-packages.js?v=20260830i"></script>
  <script src="../../js/admin-faqs.js?v=20260830i"></script>
  <script src="../../js/admin-legal.js?v=20260830i"></script>
  <script src="../../js/admin-team.js?v=20260830i"></script>
  <script src="../../js/admin-reviews.js?v=20260926b"></script>
  <script>
    renderAdminSidebar("site-content");

    const cvrIsFullAdmin = isFullAdminSession(getCustomerSession());
    const cvrTabItems = Array.from(document.querySelectorAll("#siteContentTabs .nav-item"));
    if (!cvrIsFullAdmin) {
      cvrTabItems.forEach((li) => { if (li.dataset.adminOnly === "1") li.classList.add("d-none"); });
    }

    const cvrAllTriggers = cvrTabItems.map((li) => li.querySelector(".nav-link"));
    const cvrVisibleTriggers = cvrTabItems
      .filter((li) => !li.classList.contains("d-none"))
      .map((li) => li.querySelector(".nav-link"));
    const cvrRequestedTab = new URLSearchParams(window.location.search).get("tab");
    let cvrInitialTrigger = cvrRequestedTab
      ? cvrVisibleTriggers.find((t) => t.dataset.bsTarget === `#tab-${cvrRequestedTab}`)
      : null;
    if (!cvrInitialTrigger) {
      cvrInitialTrigger = cvrVisibleTriggers.find((t) => t.classList.contains("active")) || cvrVisibleTriggers[0];
    }
    cvrAllTriggers.forEach((t) => t.classList.toggle("active", t === cvrInitialTrigger));
    document.querySelectorAll("#siteContentTabContent .tab-pane").forEach((pane) => {
      const isTarget = cvrInitialTrigger && `#${pane.id}` === cvrInitialTrigger.dataset.bsTarget;
      pane.classList.toggle("show", isTarget);
      pane.classList.toggle("active", isTarget);
    });

    if (cvrIsFullAdmin) {
      initAdminSiteTextPage();
      initAdminSitePhotosPage();
      initAdminLegalPage();
    }
    initAdminPackagesPage();
    initAdminFaqsPage();
    initAdminTeamPage();
    initAdminReviewsPage();
  </script>
</body>
</html>

@endverbatim
