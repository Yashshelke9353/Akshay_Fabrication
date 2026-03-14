from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import os
import json

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'akshay-fab-secret-2024')

# ── PostgreSQL Config ──
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:yash9353@localhost:5432/akshay_fab')
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Folder containing gallery images served statically via /static/
GALLERY_STATIC_SUBFOLDER = 'art gallery'
GALLERY_STATIC_FOLDER = os.path.join(os.path.dirname(__file__), 'static', GALLERY_STATIC_SUBFOLDER)

db = SQLAlchemy(app)

# ════════════════════════════════════════
#  MODELS
# ════════════════════════════════════════

class Settings(db.Model):
    __tablename__ = 'settings'
    id           = db.Column(db.Integer, primary_key=True)
    shop_name    = db.Column(db.String(200), default='Akshay Fabrication Works')
    owner_name   = db.Column(db.String(200), default='Akshay Santosh Wagh')
    mobile       = db.Column(db.String(20),  default='9309098190')
    whatsapp     = db.Column(db.String(20),  default='9309098190')
    address      = db.Column(db.Text,        default='Javalke Tal.Kopergaon Dist. Ahilyanagar')
    gst_no       = db.Column(db.String(50),  default='')
    admin_password = db.Column(db.String(200), default='akshay123')

    def to_dict(self):
        return {
            'shop_name':   self.shop_name,
            'owner_name':  self.owner_name,
            'mobile':      self.mobile,
            'whatsapp':    self.whatsapp,
            'address':     self.address,
            'gst_no':      self.gst_no or '',
        }


class Material(db.Model):
    __tablename__ = 'materials'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(200), nullable=False)
    unit       = db.Column(db.String(50),  nullable=False)
    price      = db.Column(db.Float,       nullable=False, default=0)
    length     = db.Column(db.Float,       nullable=False, default=0)
    girth      = db.Column(db.Float,       nullable=False, default=0)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'unit': self.unit,
            'price': self.price,
            'length': self.length,
            'girth': self.girth,
        }


class WorkType(db.Model):
    __tablename__ = 'works'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)
    components = db.relationship('WorkMaterial', backref='work', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'components': [c.to_dict() for c in self.components],
        }


class WorkMaterial(db.Model):
    __tablename__ = 'work_materials'
    id          = db.Column(db.Integer, primary_key=True)
    work_id     = db.Column(db.Integer, db.ForeignKey('works.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    name        = db.Column(db.String(200), nullable=False)
    qty         = db.Column(db.Float, default=1)
    unit        = db.Column(db.String(50), default='')
    price       = db.Column(db.Float, default=0)

    material = db.relationship('Material')

    def to_dict(self):
        return {
            'id': self.id,
            'work_id': self.work_id,
            'material_id': self.material_id,
            'name': self.name,
            'qty': self.qty,
            'unit': self.unit,
            'price': self.price,
        }


class Customer(db.Model):
    __tablename__ = 'customers'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(200), nullable=False)
    phone      = db.Column(db.String(20),  default='')
    address    = db.Column(db.Text,        default='')
    note       = db.Column(db.Text,        default='')
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)
    bills      = db.relationship('Bill', backref='customer', lazy=True, foreign_keys='Bill.customer_id')

    def to_dict(self):
        return {
            'id':      self.id,
            'name':    self.name,
            'phone':   self.phone,
            'address': self.address,
            'note':    self.note,
        }


class Bill(db.Model):
    __tablename__ = 'bills'
    id          = db.Column(db.Integer,   primary_key=True)
    bill_no     = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer,   db.ForeignKey('customers.id'), nullable=True)
    work_id     = db.Column(db.Integer,   db.ForeignKey('works.id'), nullable=True)
    cust_name   = db.Column(db.String(200), nullable=False)
    cust_phone  = db.Column(db.String(20),  default='')
    cust_addr   = db.Column(db.Text,        default='')
    bill_date   = db.Column(db.Date,        default=date.today)
    items_json  = db.Column(db.Text,        default='[]')   # JSON array of items (legacy)
    labour      = db.Column(db.Float, default=0)
    discount    = db.Column(db.Float, default=0)
    advance     = db.Column(db.Float, default=0)
    mat_sum     = db.Column(db.Float, default=0)
    total       = db.Column(db.Float, default=0)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    work = db.relationship('WorkType')
    items = db.relationship('BillItem', backref='bill', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        items = [i.to_dict() for i in self.items] if self.items else json.loads(self.items_json or '[]')
        return {
            'id':         self.id,
            'bill_no':    self.bill_no,
            'work_id':    self.work_id,
            'work_name':  self.work.name if self.work else None,
            'cust_name':  self.cust_name,
            'cust_phone': self.cust_phone,
            'cust_addr':  self.cust_addr,
            'bill_date':  self.bill_date.strftime('%Y-%m-%d') if self.bill_date else '',
            'items':      items,
            'labour':     self.labour,
            'discount':   self.discount,
            'advance':    self.advance,
            'mat_sum':    self.mat_sum,
            'total':      self.total,
        }


class BillItem(db.Model):
    __tablename__ = 'bill_items'
    id          = db.Column(db.Integer, primary_key=True)
    bill_id     = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    mat_name    = db.Column(db.String(200), nullable=False)
    qty         = db.Column(db.Float, default=0)
    unit        = db.Column(db.String(50), default='')
    price       = db.Column(db.Float, default=0)
    length      = db.Column(db.Float, default=0)
    girth       = db.Column(db.Float, default=0)

    material = db.relationship('Material')

    def to_dict(self):
        return {
            'id': self.id,
            'material_id': self.material_id,
            'matName': self.mat_name,
            'qty': self.qty,
            'unit': self.unit,
            'price': self.price,
            'length': self.length,
            'girth': self.girth,
        }


class GalleryItem(db.Model):
    __tablename__ = 'gallery'
    id         = db.Column(db.Integer, primary_key=True)
    title      = db.Column(db.String(200), nullable=False)
    category   = db.Column(db.String(50),  default='gate')
    description= db.Column(db.Text,        default='')
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'category': self.category, 'description': self.description}


# ════════════════════════════════════════
#  HELPERS
# ════════════════════════════════════════

def get_settings():
    s = Settings.query.first()
    if not s:
        s = Settings()
        db.session.add(s)
        db.session.commit()
    return s

def next_bill_no():
    last = Bill.query.order_by(Bill.id.desc()).first()
    num = (last.id + 1) if last else 1
    return f'AFW-{num:04d}'

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


# ════════════════════════════════════════
#  PUBLIC ROUTES
# ════════════════════════════════════════

@app.route('/')
def index():
    s = get_settings()
    return render_template('index.html', settings=s)

@app.route('/about')
def about():
    s = get_settings()
    return render_template('about.html', settings=s)

def _infer_category_from_filename(filename):
    name = filename.lower()
    if 'gate' in name or 'गेट' in name:
        return 'gate'
    if 'shed' in name or 'शेड' in name:
        return 'shed'
    if 'grill' in name or 'ग्रिल' in name:
        return 'grill'
    if 'railing' in name or 'rail' in name or 'रेलिंग' in name:
        return 'railing'
    if 'window' in name or 'khidki' in name or 'खिडकी' in name:
        return 'grill'
    if 'door' in name or 'दरवाजा' in name:
        return 'gate'
    return 'gate'


def _title_from_filename(filename):
    base = os.path.splitext(filename)[0]
    title = base.replace('_', ' ').replace('-', ' ')  # keep spaces
    # Prefer Marathi labels for common terms
    title = title.replace('gate', 'गेट').replace('shed', 'शेड').replace('grill', 'ग्रिल').replace('railing', 'रेलिंग').replace('door', 'दरवाजा').replace('window', 'खिडकी')
    return title


@app.route('/gallery')
def gallery():
    s = get_settings()
    items = []
    try:
        for fname in sorted(os.listdir(GALLERY_STATIC_FOLDER), reverse=True):
            if not fname.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                continue
            items.append({
                'title': _title_from_filename(fname),
                'category': _infer_category_from_filename(fname),
                'description': '',
                'filename': fname,
            })
    except FileNotFoundError:
        # folder may not exist yet
        pass
    return render_template('gallery.html', settings=s, items=items)

@app.route('/contact')
def contact():
    s = get_settings()
    return render_template('contact.html', settings=s)

@app.route('/admin')
def admin():
    s = get_settings()
    return render_template('admin.html', settings=s)


# ════════════════════════════════════════
#  AUTH API
# ════════════════════════════════════════

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    s = get_settings()
    if data.get('password') == s.admin_password:
        session['admin_logged_in'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'चुकीचा password!'})

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/check-auth')
def check_auth():
    return jsonify({'logged_in': bool(session.get('admin_logged_in'))})


# ════════════════════════════════════════
#  SETTINGS API
# ════════════════════════════════════════

@app.route('/api/settings', methods=['GET'])
def api_get_settings():
    return jsonify(get_settings().to_dict())

@app.route('/api/settings', methods=['POST'])
@login_required
def api_save_settings():
    data = request.json
    s = get_settings()
    s.shop_name  = data.get('shop_name',  s.shop_name)
    s.owner_name = data.get('owner_name', s.owner_name)
    s.mobile     = data.get('mobile',     s.mobile)
    s.whatsapp   = data.get('whatsapp',   s.whatsapp)
    s.address    = data.get('address',    s.address)
    s.gst_no     = data.get('gst_no',     s.gst_no)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/settings/password', methods=['POST'])
@login_required
def api_change_password():
    data = request.json
    s = get_settings()
    s.admin_password = data.get('password', s.admin_password)
    db.session.commit()
    return jsonify({'success': True})


# ════════════════════════════════════════
#  MATERIALS API
# ════════════════════════════════════════

@app.route('/api/materials', methods=['GET'])
def api_get_materials():
    mats = Material.query.order_by(Material.id).all()
    return jsonify([m.to_dict() for m in mats])

@app.route('/api/materials', methods=['POST'])
@login_required
def api_add_material():
    data = request.json
    m = Material(
        name=data['name'],
        unit=data['unit'],
        price=float(data.get('price', 0)),
        length=float(data.get('length', 0)),
        girth=float(data.get('girth', 0)),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict())

@app.route('/api/materials/<int:mid>', methods=['PUT'])
@login_required
def api_update_material(mid):
    m = Material.query.get_or_404(mid)
    data = request.json
    m.name   = data.get('name',  m.name)
    m.unit   = data.get('unit',  m.unit)
    m.price  = float(data.get('price', m.price))
    m.length = float(data.get('length', m.length))
    m.girth  = float(data.get('girth', m.girth))
    db.session.commit()
    return jsonify(m.to_dict())

@app.route('/api/materials/<int:mid>', methods=['DELETE'])
@login_required
def api_delete_material(mid):
    m = Material.query.get_or_404(mid)
    db.session.delete(m)
    db.session.commit()
    return jsonify({'success': True})


# ════════════════════════════════════════
#  WORK TYPES API
# ════════════════════════════════════════

@app.route('/api/works', methods=['GET'])
def api_get_works():
    works = WorkType.query.order_by(WorkType.id).all()
    return jsonify([w.to_dict() for w in works])

@app.route('/api/works', methods=['POST'])
@login_required
def api_add_work():
    data = request.json
    w = WorkType(name=data.get('name', '').strip())
    db.session.add(w)
    db.session.commit()
    return jsonify(w.to_dict())

@app.route('/api/works/<int:wid>', methods=['PUT'])
@login_required
def api_update_work(wid):
    w = WorkType.query.get_or_404(wid)
    data = request.json
    w.name = data.get('name', w.name).strip()
    db.session.commit()
    return jsonify(w.to_dict())

@app.route('/api/works/<int:wid>', methods=['DELETE'])
@login_required
def api_delete_work(wid):
    w = WorkType.query.get_or_404(wid)
    db.session.delete(w)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/works/<int:wid>/components', methods=['POST'])
@login_required
def api_add_work_component(wid):
    WorkType.query.get_or_404(wid)
    data = request.json
    wm = WorkMaterial(
        work_id     = wid,
        material_id = data.get('material_id'),
        name        = data.get('name', ''),
        qty         = float(data.get('qty', 1)),
        unit        = data.get('unit', ''),
        price       = float(data.get('price', 0)),
    )
    db.session.add(wm)
    db.session.commit()
    return jsonify(wm.to_dict())

@app.route('/api/works/<int:wid>/components/<int:cid>', methods=['PUT'])
@login_required
def api_update_work_component(wid, cid):
    wm = WorkMaterial.query.filter_by(id=cid, work_id=wid).first_or_404()
    data = request.json
    wm.material_id = data.get('material_id', wm.material_id)
    wm.name        = data.get('name', wm.name)
    wm.qty         = float(data.get('qty', wm.qty))
    wm.unit        = data.get('unit', wm.unit)
    wm.price       = float(data.get('price', wm.price))
    db.session.commit()
    return jsonify(wm.to_dict())

@app.route('/api/works/<int:wid>/components/<int:cid>', methods=['DELETE'])
@login_required
def api_delete_work_component(wid, cid):
    wm = WorkMaterial.query.filter_by(id=cid, work_id=wid).first_or_404()
    db.session.delete(wm)
    db.session.commit()
    return jsonify({'success': True})


# ════════════════════════════════════════
#  CUSTOMERS API
# ════════════════════════════════════════

@app.route('/api/customers', methods=['GET'])
@login_required
def api_get_customers():
    q = request.args.get('q', '')
    query = Customer.query
    if q:
        query = query.filter(
            (Customer.name.ilike(f'%{q}%')) | (Customer.phone.ilike(f'%{q}%'))
        )
    customers = query.order_by(Customer.id.desc()).all()
    result = []
    for c in customers:
        d = c.to_dict()
        d['bill_count'] = Bill.query.filter_by(customer_id=c.id).count()
        d['total_spent'] = db.session.query(db.func.sum(Bill.total)).filter_by(customer_id=c.id).scalar() or 0
        result.append(d)
    return jsonify(result)

@app.route('/api/customers', methods=['POST'])
@login_required
def api_add_customer():
    data = request.json
    c = Customer(
        name=data['name'],
        phone=data.get('phone', ''),
        address=data.get('address', ''),
        note=data.get('note', '')
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict())

@app.route('/api/customers/<int:cid>', methods=['PUT'])
@login_required
def api_update_customer(cid):
    c = Customer.query.get_or_404(cid)
    data = request.json
    c.name    = data.get('name',    c.name)
    c.phone   = data.get('phone',   c.phone)
    c.address = data.get('address', c.address)
    c.note    = data.get('note',    c.note)
    db.session.commit()
    return jsonify(c.to_dict())

@app.route('/api/customers/<int:cid>', methods=['DELETE'])
@login_required
def api_delete_customer(cid):
    c = Customer.query.get_or_404(cid)
    db.session.delete(c)
    db.session.commit()
    return jsonify({'success': True})


# ════════════════════════════════════════
#  BILLS API
# ════════════════════════════════════════

@app.route('/api/bills', methods=['GET'])
@login_required
def api_get_bills():
    q = request.args.get('q', '')
    query = Bill.query
    if q:
        query = query.filter(
            (Bill.cust_name.ilike(f'%{q}%')) | (Bill.cust_phone.ilike(f'%{q}%'))
        )
    bills = query.order_by(Bill.id.desc()).all()
    return jsonify([b.to_dict() for b in bills])

@app.route('/api/bills', methods=['POST'])
@login_required
def api_create_bill():
    data = request.json
    items = data.get('items', [])
    mat_sum  = sum(i.get('qty', 0) * i.get('price', 0) for i in items)
    labour   = float(data.get('labour', 0))
    discount = float(data.get('discount', 0))
    advance  = float(data.get('advance', 0))
    total    = mat_sum + labour - discount

    # Find or create customer
    customer_id = None
    if data.get('cust_phone'):
        c = Customer.query.filter_by(phone=data['cust_phone']).first()
        if not c:
            c = Customer(name=data['cust_name'], phone=data['cust_phone'], address=data.get('cust_addr', ''))
            db.session.add(c)
            db.session.flush()
        customer_id = c.id

    bill = Bill(
        bill_no     = next_bill_no(),
        customer_id = customer_id,
        work_id     = data.get('work_id'),
        cust_name   = data['cust_name'],
        cust_phone  = data.get('cust_phone', ''),
        cust_addr   = data.get('cust_addr', ''),
        bill_date   = datetime.strptime(data['bill_date'], '%Y-%m-%d').date() if data.get('bill_date') else date.today(),
        items_json  = json.dumps(items),
        labour      = labour,
        discount    = discount,
        advance     = advance,
        mat_sum     = mat_sum,
        total       = total,
    )
    db.session.add(bill)
    db.session.flush()

    # Save detailed items for reporting / editing
    for i in items:
        bi = BillItem(
            bill_id     = bill.id,
            material_id = i.get('material_id'),
            mat_name    = i.get('matName') or i.get('name') or '',
            qty         = float(i.get('qty', 0)) if i.get('qty') is not None else 0,
            unit        = i.get('unit') or '',
            price       = float(i.get('price', 0)) if i.get('price') is not None else 0,
            length      = float(i.get('length', 0)) if i.get('length') is not None else 0,
            girth       = float(i.get('girth', 0)) if i.get('girth') is not None else 0,
        )
        db.session.add(bi)

    db.session.commit()
    return jsonify(bill.to_dict())

@app.route('/api/bills/<int:bid>', methods=['GET'])
@login_required
def api_get_bill(bid):
    b = Bill.query.get_or_404(bid)
    return jsonify(b.to_dict())

@app.route('/api/bills/<int:bid>', methods=['PUT'])
@login_required
def api_update_bill(bid):
    b = Bill.query.get_or_404(bid)
    data = request.json
    items    = data.get('items', json.loads(b.items_json))
    mat_sum  = sum(i.get('qty', 0) * i.get('price', 0) for i in items)
    labour   = float(data.get('labour', b.labour))
    discount = float(data.get('discount', b.discount))
    advance  = float(data.get('advance', b.advance))
    total    = mat_sum + labour - discount

    b.work_id    = data.get('work_id', b.work_id)
    b.cust_name  = data.get('cust_name',  b.cust_name)
    b.cust_phone = data.get('cust_phone', b.cust_phone)
    b.cust_addr  = data.get('cust_addr',  b.cust_addr)
    b.bill_date  = datetime.strptime(data['bill_date'], '%Y-%m-%d').date() if data.get('bill_date') else b.bill_date
    b.items_json = json.dumps(items)
    b.labour     = labour
    b.discount   = discount
    b.advance    = advance
    b.mat_sum    = mat_sum
    b.total      = total

    # Replace detailed item records
    BillItem.query.filter_by(bill_id=b.id).delete()
    for i in items:
        bi = BillItem(
            bill_id     = b.id,
            material_id = i.get('material_id'),
            mat_name    = i.get('matName') or i.get('name') or '',
            qty         = float(i.get('qty', 0)) if i.get('qty') is not None else 0,
            unit        = i.get('unit') or '',
            price       = float(i.get('price', 0)) if i.get('price') is not None else 0,
            length      = float(i.get('length', 0)) if i.get('length') is not None else 0,
            girth       = float(i.get('girth', 0)) if i.get('girth') is not None else 0,
        )
        db.session.add(bi)

    db.session.commit()
    return jsonify(b.to_dict())

@app.route('/api/bills/<int:bid>', methods=['DELETE'])
@login_required
def api_delete_bill(bid):
    b = Bill.query.get_or_404(bid)
    db.session.delete(b)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/dashboard')
@login_required
def api_dashboard():
    today = date.today()
    today_income  = db.session.query(db.func.sum(Bill.total)).filter(Bill.bill_date == today).scalar() or 0
    total_income  = db.session.query(db.func.sum(Bill.total)).scalar() or 0
    total_bills   = Bill.query.count()
    total_customers = Customer.query.count()
    recent_bills  = [b.to_dict() for b in Bill.query.order_by(Bill.id.desc()).limit(5).all()]
    recent_customers = [c.to_dict() for c in Customer.query.order_by(Customer.id.desc()).limit(5).all()]
    return jsonify({
        'today_income':    today_income,
        'total_income':    total_income,
        'total_bills':     total_bills,
        'total_customers': total_customers,
        'recent_bills':    recent_bills,
        'recent_customers': recent_customers,
    })


# ════════════════════════════════════════
#  GALLERY API
# ════════════════════════════════════════

@app.route('/api/gallery', methods=['GET'])
def api_get_gallery():
    items = GalleryItem.query.order_by(GalleryItem.id.desc()).all()
    return jsonify([i.to_dict() for i in items])

@app.route('/api/gallery', methods=['POST'])
@login_required
def api_add_gallery():
    data = request.json
    g = GalleryItem(title=data['title'], category=data.get('category','gate'), description=data.get('description',''))
    db.session.add(g)
    db.session.commit()
    return jsonify(g.to_dict())

@app.route('/api/gallery/<int:gid>', methods=['DELETE'])
@login_required
def api_delete_gallery(gid):
    g = GalleryItem.query.get_or_404(gid)
    db.session.delete(g)
    db.session.commit()
    return jsonify({'success': True})


# ════════════════════════════════════════
#  INIT DB
# ════════════════════════════════════════

def seed_db():
    """Seed initial data if tables are empty."""
    if not Settings.query.first():
        db.session.add(Settings())
        db.session.commit()

    if not Material.query.first():
        seeds = [
            Material(name='MS Pipe',      unit='kg',    price=80),
            Material(name='MS Sheet',     unit='sq ft', price=120),
            Material(name='Angle Iron',   unit='kg',    price=75),
            Material(name='Square Pipe',  unit='kg',    price=85),
            Material(name='Flat Bar',     unit='kg',    price=78),
            Material(name='Round Bar',    unit='kg',    price=82),
            Material(name='वेल्डिंग रॉड', unit='kg',    price=140),
            Material(name='हिंज',         unit='piece', price=25),
            Material(name='पेंट',         unit='litre', price=350),
        ]
        db.session.bulk_save_objects(seeds)
        db.session.commit()

    # Seed default work types
    if not WorkType.query.first():
        # Ensure materials exist
        def mat(name):
            return Material.query.filter_by(name=name).first()

        works = [
            ('कंपाऊंड गेट', ['MS Pipe', 'MS Sheet', 'वेल्डिंग रॉड', 'हिंज', 'पेंट']),
            ('मेन गेट', ['MS Pipe', 'MS Sheet', 'वेल्डिंग रॉड', 'हिंज', 'पेंट']),
            ('शेड', ['MS Pipe', 'MS Sheet', 'Angle Iron', 'वेल्डिंग रॉड', 'पेंट']),
            ('खिडकी ग्रिल', ['MS Pipe', 'Square Pipe', 'वेल्डिंग रॉड', 'पेंट']),
            ('दरवाजा', ['MS Pipe', 'MS Sheet', 'वेल्डिंग रॉड', 'हिंज', 'पेंट']),
            ('रेलिंग', ['MS Pipe', 'Flat Bar', 'Round Bar', 'वेल्डिंग रॉड', 'पेंट']),
        ]
        for wname, components in works:
            w = WorkType(name=wname)
            db.session.add(w)
            db.session.flush()
            for comp in components:
                m = mat(comp)
                if m:
                    wm = WorkMaterial(work_id=w.id, material_id=m.id, name=m.name, unit=m.unit, price=m.price, qty=1)
                else:
                    wm = WorkMaterial(work_id=w.id, name=comp, unit='', price=0, qty=1)
                db.session.add(wm)
        db.session.commit()

def ensure_column(table_name, column_name, column_def):
    """Ensure a column exists in the given table; if missing, ALTER TABLE to add it."""
    from sqlalchemy import inspect, text
    insp = inspect(db.engine)
    if column_name not in [c['name'] for c in insp.get_columns(table_name)]:
        with db.engine.connect() as conn:
            conn.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}'))
            conn.commit()

# Initialize database on startup
with app.app_context():
    db.create_all()
    # For existing installations: ensure new schema columns exist
    ensure_column('bills', 'work_id', 'INTEGER')
    ensure_column('materials', 'length', 'FLOAT DEFAULT 0')
    ensure_column('materials', 'girth', 'FLOAT DEFAULT 0')
    ensure_column('bill_items', 'length', 'FLOAT DEFAULT 0')
    ensure_column('bill_items', 'girth', 'FLOAT DEFAULT 0')
    seed_db()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
