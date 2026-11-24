const Project = require('../models/Project');
const { getPagination } = require('../utils/pagination');

// Helper to check expiry
const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return 'unknown';
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    // Reset hours for day comparison
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring_soon';
    return 'active';
};

// GET /api/admin/projects
const getProjects = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req);
        const { search, category, projectType, status, renewalAlert } = req.query;

        const query = {};

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: regex },
                { clientName: regex },
                { clientPhone: regex },
                { clientOrganization: regex },
                { projectUrl: regex },
                { category: regex }
            ];
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        if (projectType && projectType !== 'all') {
            query.projectType = projectType;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const total = await Project.countDocuments(query);
        let projects = await Project.find(query)
            .populate('createdBy', 'name email role')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        // Add calculated renewal alert flags to each project
        const todayStr = new Date().toISOString().split('T')[0];
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0];

        const enrichedProjects = projects.map(proj => {
            const projObj = proj.toObject();
            const alertItems = [];

            // Check server
            if (projObj.serverExpiryDate) {
                const sStatus = getExpiryStatus(projObj.serverExpiryDate);
                if (sStatus === 'expired' || sStatus === 'expiring_soon') {
                    alertItems.push({
                        item: 'Server / Hosting',
                        expiryDate: projObj.serverExpiryDate,
                        status: sStatus,
                        amount: projObj.serverPrice
                    });
                }
            }

            // Check AMC
            if (projObj.amcExpiryDate) {
                const aStatus = getExpiryStatus(projObj.amcExpiryDate);
                if (aStatus === 'expired' || aStatus === 'expiring_soon') {
                    alertItems.push({
                        item: 'AMC',
                        expiryDate: projObj.amcExpiryDate,
                        status: aStatus,
                        amount: projObj.amcPrice
                    });
                }
            }

            // Check additional services (Domain, etc.)
            if (Array.isArray(projObj.additionalServices)) {
                projObj.additionalServices.forEach(srv => {
                    if (srv.expiryDate) {
                        const srvStatus = getExpiryStatus(srv.expiryDate);
                        if (srvStatus === 'expired' || srvStatus === 'expiring_soon') {
                            alertItems.push({
                                item: srv.serviceType + (srv.title ? ` (${srv.title})` : ''),
                                expiryDate: srv.expiryDate,
                                status: srvStatus,
                                amount: srv.amount
                            });
                        }
                    }
                });
            }

            projObj.renewalAlerts = alertItems;
            return projObj;
        });

        // If renewalAlert filter is requested
        let finalProjects = enrichedProjects;
        if (renewalAlert === 'true') {
            finalProjects = enrichedProjects.filter(p => p.renewalAlerts.length > 0);
        }

        res.json({
            data: finalProjects,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// GET /api/admin/projects/stats
const getProjectStats = async (req, res) => {
    try {
        const allProjects = await Project.find({});

        let totalRevenue = 0;
        let liveCount = 0;
        let inProgressCount = 0;
        let completedCount = 0;
        let expiringSoonCount = 0;
        let expiredCount = 0;

        const checkAlert = (expiryDate) => {
            if (!expiryDate) return;
            const status = getExpiryStatus(expiryDate);
            if (status === 'expiring_soon') expiringSoonCount++;
            if (status === 'expired') expiredCount++;
        };

        allProjects.forEach(proj => {
            if (proj.status === 'Live') liveCount++;
            else if (proj.status === 'In Progress') inProgressCount++;
            else if (proj.status === 'Completed') completedCount++;

            // Sum Revenue
            totalRevenue += (proj.softwarePrice || 0);
            totalRevenue += (proj.serverPrice || 0);
            totalRevenue += (proj.amcPrice || 0);

            // Check server & amc expiry
            checkAlert(proj.serverExpiryDate);
            checkAlert(proj.amcExpiryDate);

            if (Array.isArray(proj.additionalServices)) {
                proj.additionalServices.forEach(srv => {
                    totalRevenue += (srv.amount || 0);
                    checkAlert(srv.expiryDate);
                });
            }
        });

        res.json({
            totalProjects: allProjects.length,
            liveProjects: liveCount,
            inProgressProjects: inProgressCount,
            completedProjects: completedCount,
            totalRevenue,
            expiringSoonCount,
            expiredCount
        });
    } catch (err) {
        console.error('Error fetching project stats:', err);
        res.status(500).json({ error: 'Failed to fetch project stats' });
    }
};

// GET /api/admin/projects/:id
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('createdBy', 'name email role');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
};

// POST /api/admin/projects
const createProject = async (req, res) => {
    try {
        const data = {
            ...req.body,
            createdBy: req.user ? req.user._id : null
        };
        const project = await Project.create(data);
        res.status(201).json(project);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(400).json({ error: err.message || 'Failed to create project' });
    }
};

// PUT /api/admin/projects/:id
const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(400).json({ error: err.message || 'Failed to update project' });
    }
};

// DELETE /api/admin/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(400).json({ error: 'Failed to delete project' });
    }
};

module.exports = {
    getProjects,
    getProjectStats,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
