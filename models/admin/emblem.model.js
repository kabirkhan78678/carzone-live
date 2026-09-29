import db from '../../config/db.js';

export const createEmblemModel = async ({
    emblem_name,
    image,
    description
}) => {

    return db.query(
        `
        INSERT INTO tbl_emblems
        (
            emblem_name,
            image,
            description
        )
        VALUES
        (
            ?,
            ?,
            ?
        )
        `,
        [
            emblem_name,
            image,
            description
        ]
    );

};


export const getEmblemByIdModel = async (id) => {

    const result = await db.query(
        `
        SELECT *
        FROM tbl_emblems
        WHERE id = ?
        AND is_delete = 0
        `,
        [id]
    );

    return result[0];
};


export const updateEmblemModel = async ({
    id,
    emblem_name,
    image,
    description,
    status
}) => {

    return db.query(
        `
        UPDATE tbl_emblems
        SET
            emblem_name = ?,
            image = ?,
            description = ?,
            status = ?
        WHERE id = ?
        `,
        [
            emblem_name,
            image,
            description,
            status,
            id
        ]
    );

};


export const deleteEmblemModel = async (id) => {

    return db.query(
        `
        UPDATE tbl_emblems
        SET is_delete = 1
        WHERE id = ?
        `,
        [id]
    );

};

export const getEmblemListModel = async ({
    page=1,
    limit=20,
    search="",
    status=""
})=>{

    const offset=(page-1)*limit;

    let where = `WHERE 1=1 AND is_delete = 0`;

    const params=[];

    if(search){

        where+=`
        AND
        (
            emblem_name LIKE ?
            OR description LIKE ?
        )
        `;

        const keyword=`%${search}%`;

        params.push(keyword,keyword);

    }

    if(status!==""){

        where+=` AND status=?`;

        params.push(status);

    }

    const data=await db.query(

        `
        SELECT *
        FROM tbl_emblems

        ${where}

        ORDER BY id DESC

        LIMIT ?

        OFFSET ?

        `,

        [...params,limit,offset]

    );

    const totalResult=await db.query(

        `
        SELECT COUNT(*) total

        FROM tbl_emblems

        ${where}
        `,

        params

    );

    return{

        total:totalResult[0].total,

        data

    };

};

export const fetchEmblemById = async (id) => {

    const result = await db.query(
        `
        SELECT *
        FROM tbl_emblems
        WHERE id = ?
        AND is_delete = 0
        `,
        [id]
    );

    return result;

};
