const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

// Route pour obtenir la liste des universités
exports.getUniversities = async (req, res) => {
    try {
        // Utiliser select pour ne récupérer que le champ nomUni
        const universities = await prisma.university.findMany({
            select: {
                nomUni: true,  
                idUni: true    
            }
        });
        res.json(universities);
    } catch (error) {
      console.error('Error fetching universities:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des universités' });
    }
  };
  
// Upload de fichier CSV
exports.uploadFaculties = async (req, res) => {
    try {
         console.log("Contrôleur - Body:", req.body);
         const { universityId } = req.body;

        if (!universityId ) {
            return res.status(400).json({ message: "ID d'université invalide ou manquant." });
        }

        const university = await prisma.university.findUnique({
            where: { idUni: parseInt(universityId) }
        });
        if (!university) {
            return res.status(404).json({ message: "Université non trouvée." });
        }

        
        
        
        const faculties = [];
        fs.createReadStream(path.join(__dirname, '../../uploads/', req.file.filename))
            .pipe(csv.parse({ headers: true }))
            .on('error', error => { throw error; })
            .on('data', (row) => {
                if (!row.nomFaculty) { // ou row.nomDepart pour departments
                    throw new Error("Le fichier CSV doit contenir une colonne 'nomFaculty'");
                }
                console.log(university.idUni);
                faculties.push({
                    nomFaculty: row.nomFaculty,
                    idUni: university.idUni 
                 
                });
            })
            .on('end', async () => {
                try {
                    await prisma.$transaction(async (prisma) => {
                        for (const faculty of faculties) {
                            const existingFaculty = await prisma.faculty.findFirst({
                                where: { nomFaculty: faculty.nomFaculty, idUni: faculty.idUni }
                            });
                    
                            if (!existingFaculty) {
                                await prisma.faculty.create({ data: faculty });
                            }
                        }
                    });

                    
                    // Suppression du fichier après l'importation
                    const filePath = path.join(__dirname, '../../uploads/', req.file.filename);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error("Erreur lors de la suppression du fichier des facultes:", err);
                        } else {
                            console.log("Fichier de facultés supprimé avec succès:", req.file.filename);
                        }
                    });
                    
                    res.json({
                        status: "ok",
                        filename: req.file.originalname,
                        message: "Upload fichier des facultés réussi!",
                        count: faculties.length
                    });
                } catch (error) {
                    console.error("Erreur Prisma:", error);
                    res.status(500).json({
                        status: "fail",
                        message: error.message
                    });
                }
            });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
};

// Récupérer les facultés
exports.getFaculties = async (req, res) => {
    try {
        const faculties = await prisma.faculty.findMany({
            where: { idUni: parseInt(req.query.universityId) },
            select: { idFaculty: true, nomFaculty: true }
        });
        res.json(faculties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Upload de fichier CSV
exports.uploadDepartments = async (req, res) => {
    try {
        const { facultyId } = req.body;
      
        if (!facultyId) {
            return res.status(400).json({ message: "L'ID de la faculté est requis." });
        }
        // Validation des IDs
        const faculty = await prisma.faculty.findUnique({
            where: { idFaculty: parseInt(facultyId) },
            include: { university: true }
        });
        if (!faculty) {
            return res.status(404).json({ message: "Faculté non trouvée." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier fourni." });
        }
        
        const departments = [];

        fs.createReadStream(path.join(__dirname, '../../uploads/', req.file.filename))
            .pipe(csv.parse({ headers: true }))
            .on('error', error => { throw error; })
            .on('data', (row) => {
                if (!row.nomDepartment) {
                    throw new Error("Le fichier CSV doit contenir une colonne 'nomDepartment'");
                }
                departments.push({
                    nomDepart: row.nomDepartment,
                    idFaculty: faculty.idFaculty,
                    idUni: faculty.university.idUni,
                                    
                });
            })
            .on('end', async () => {
                try {
                    await prisma.$transaction(async (prisma) => {
                        for (const department of departments) {
                            const existingDepartment = await prisma.department.findFirst({
                                where: { nomDepart: department.nomDepart, idFaculty: department.idFaculty }
                            });
                    
                            if (!existingDepartment) {
                                await prisma.department.create({ data: department });
                            }
                        }
                    });

                    
                    // Suppression du fichier après l'importation
                    const filePath = path.join(__dirname, '../../uploads/', req.file.filename);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error("Erreur lors de la suppression du fichier des départements:", err);
                        } else {
                            console.log("Fichier de facultés supprimé avec succès:", req.file.filename);
                        }
                    });
                    
                    res.json({
                        status: "ok",
                        filename: req.file.originalname,
                        message: "Upload fichier des départements réussi!",
                        count: departments.length
                    });
                } catch (error) {
                    console.error("Erreur Prisma:", error);
                    res.status(500).json({
                        status: "fail",
                        message: error.message
                    });
                }
            });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
};

